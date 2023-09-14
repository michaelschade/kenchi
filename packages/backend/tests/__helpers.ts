import fetchCookie from 'fetch-cookie';
import getPort from 'get-port';
import type { oauth2_v2 } from 'googleapis';
import { google } from 'googleapis';
import { Server } from 'http';
import { range, shuffle } from 'lodash';
import fetchOriginal, { Response } from 'node-fetch';
import { BranchTypeEnum, PrismaClient, User } from 'prisma-client';

import { makeApp } from '../api/app';
import { closeDB } from '../api/db';

jest.mock('googleapis');

const googleMock = google as unknown as jest.Mocked<typeof google>;

const PORTS = shuffle(range(4001, 4999));

function getResult(response: Response): Promise<any> {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.startsWith('application/json')) {
    return response.json();
  } else {
    return response.text();
  }
}

const fetch = fetchCookie(fetchOriginal);
class GraphQLClient {
  private csrfToken: string | null = null;
  constructor(private url: string) {}

  async request<T = any, V = Record<string, unknown>>(
    query: string,
    variables?: V,
    allowError = false
  ): Promise<T> {
    if (!this.csrfToken) {
      await this.refreshCSRFToken();
    }

    const body = JSON.stringify({
      query,
      variables: variables ? variables : undefined,
    });

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.csrfToken!,
      },
      body,
    });

    const result = await getResult(response);

    if (allowError) {
      return result;
    } else if (response.ok && !result.errors && result.data) {
      return result.data;
    } else {
      const errorResult =
        typeof result === 'string' ? { error: result } : result;
      expect({
        ...errorResult,
        status: response.status,
        query,
        variables,
      }).toBeNull();
      throw new Error('unreachable');
    }
  }

  private async refreshCSRFToken(): Promise<void> {
    const resp = await fetch(`${this.url}?query={viewer{csrfToken}}`);
    const data = await resp.json();
    this.csrfToken = data.data.viewer.csrfToken;
  }
}

type TestContext = {
  client: GraphQLClient;
  app: {
    db: PrismaClient;
    start: () => Promise<void>;
    stop: () => Promise<void>;
  };
};

export function createTestContext(): TestContext {
  const ctx = {} as TestContext;

  beforeAll(async () => {
    const port = await getPort({ port: PORTS });
    const app = await makeApp();
    let server: Server;
    Object.assign(ctx, {
      client: new GraphQLClient(`http://localhost:${port}/graphql`),
      app: {
        db: new PrismaClient(),
        start: () =>
          new Promise<void>((resolve) => {
            server = app.listen(port, resolve);
          }),
        stop: async () => {
          await server.close();
          await closeDB();
        },
      },
    });

    await ctx.app.start();
  });

  afterAll(async () => {
    await ctx.app.stop();
    await ctx.app.db.$disconnect();
  });

  return ctx;
}

export function mockAuth(
  ctx: TestContext,
  {
    user,
    oauthData,
  }: { user?: User; oauthData?: Partial<oauth2_v2.Schema$Userinfo> } = {}
) {
  // @ts-ignore
  googleMock.auth.OAuth2.mockImplementation(() => ({
    setCredentials: () => {},
  }));

  // @ts-ignore
  googleMock.oauth2.mockImplementation(() => ({
    userinfo: {
      get: () => {
        if (user) {
          const { email, googleId, name, givenName } = user;
          const data: oauth2_v2.Schema$Userinfo = {
            email,
            id: googleId,
            name,
            given_name: givenName,
            ...oauthData,
          };
          return Promise.resolve({ data });
        } else {
          const data: oauth2_v2.Schema$Userinfo = {
            email: `brian+${Math.random()}@example.com`,
            hd: 'example.com',
            id: `0${Math.random().toString().split('.')[1]}`,
            name: 'Brian Krausz',
            given_name: 'Brian',
            ...oauthData,
          };
          return Promise.resolve({ data });
        }
      },
    },
  }));
}

export async function loginAndCreateOrg(
  ctx: TestContext,
  user?: User
): Promise<[string, string, string]> {
  mockAuth(ctx);
  await loginWithoutOrg(ctx, user);
  const { createOrganization } = await ctx.client.request(
    `mutation Mutation {
      createOrganization {
        viewer {
          user {
            id
          }
          organization {
            id
            collections(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    }`
  );

  // Return a collection ID because many tests require it
  return [
    createOrganization.viewer.user.id,
    createOrganization.viewer.organization.collections.edges[0].node.id,
    createOrganization.viewer.organization.id,
  ];
}

export async function loginWithoutOrg(ctx: TestContext, user?: User) {
  mockAuth(ctx, { user });

  const { login } = await ctx.client.request(
    `mutation LoginMutation($token: String!) {
        login(token: $token) {
          error {
            message
          }
          viewer {
            user {
              id
              email
            }
          }
        }
      }`,
    {
      token: 'test_token',
    }
  );

  expect(login.error).toBe(null);

  return login.viewer.user.id;
}

export type TestCall = {
  gql: string;
  variables:
    | Record<string, unknown>
    | ((args: Record<string, any>) => Record<string, unknown>);
  errorMessage?: jest.Expect;
  reduce?: (
    args: Record<string, unknown>,
    model: Record<string, unknown>
  ) => Record<string, unknown>;
};
export type TestDBObject =
  | Record<string, unknown>
  | ((previousObjects: Record<string, any>[]) => Record<string, unknown>);

export const reduceVersionSequence =
  (from: string, to?: string) =>
  (args: Record<string, unknown>, model: Record<string, unknown>) => ({
    ...args,
    [to || from]: model[from],
  });
export const testVersionSequence = async (
  ctx: TestContext,
  findMany: (args: {
    where: { staticId: string };
    orderBy: { id: 'asc' };
  }) => Promise<Record<string, any>[]>,
  staticIdPrefix: string,
  objectKey: string,
  calls: TestCall[],
  expectedObjects: TestDBObject[]
) => {
  const [, collectionId] = await loginAndCreateOrg(ctx);
  let args: Record<string, unknown> = { collectionId };
  let staticId: string | null = null;
  for (let i = 0; i < calls.length; i++) {
    const { gql, variables, errorMessage, reduce = (i) => i } = calls[i];
    const resp = await ctx.client.request(
      gql,
      typeof variables === 'function' ? variables(args) : variables
    );
    if (errorMessage) {
      expect(resp).toMatchObject({
        testMutation: {
          error: {
            message: errorMessage,
          },
        },
      });
    } else {
      expect(resp).toMatchObject({
        testMutation: {
          error: null,
          [objectKey]: {
            staticId: expect.stringContaining(staticIdPrefix),
          },
        },
      });
      staticId = resp.testMutation[objectKey].staticId;
      args = reduce(args, resp.testMutation[objectKey]);
    }
  }
  const objects = await findMany({
    where: { staticId: staticId! },
    orderBy: { id: 'asc' },
  });
  expect(objects).toStrictEqual(
    expectedObjects.map((o, i) => {
      if (typeof o === 'function') {
        return expect.objectContaining(o(objects.slice(0, i + 1)));
      } else {
        return expect.objectContaining(o);
      }
    })
  );
};

type CreateInputWithCollection = {
  collectionId: string;
  branchType?: BranchTypeEnum;
  [key: string]: string | undefined;
};

export const createCollection = (
  ctx: TestContext,
  data: Record<string, unknown>
) =>
  requestAndVerify(
    ctx,
    `mutation Mutation($data: CollectionInput!) {
      modify: createCollection(collectionData: $data) {
        obj: collection {
          id
          name
          acl {
            userGroup {
              id
            }
            user {
              id
            }
            permissions
          }
          defaultPermissions
        }
        error {
          message
        }
      }
    }`,
    { data }
  );

export const createTool = (
  ctx: TestContext,
  toolData: CreateInputWithCollection
) =>
  requestAndVerify(
    ctx,
    `mutation Mutation($toolData: ToolCreateInput!) {
      modify: createTool(toolData: $toolData) {
        error {
          message
        }
        obj: tool {
          id
          staticId
        }
      }
    }`,
    {
      toolData: {
        name: 'Test Automation',
        description: 'Description',
        component: 'GmailAction',
        inputs: [],
        configuration: {
          data: {
            slate: true,
            singleLine: false,
            rich: true,
            children: [{ children: [{ text: `Snippet text` }] }],
          },
        },
        keywords: [],
        branchType: BranchTypeEnum.published,
        ...toolData,
      },
    }
  );

export const updateTool = (
  ctx: TestContext,
  id: string,
  toolData: Record<string, unknown>
) =>
  requestAndVerify(
    ctx,
    `mutation Mutation($id: ID!, $toolData: ToolUpdateInput!) {
      modify: updateTool(id: $id, toolData: $toolData) {
        error {
          message
        }
        obj: tool {
          id
          staticId
        }
      }
    }`,
    { id, toolData }
  );

export const archiveTool = (ctx: TestContext, id: string) =>
  requestAndVerify(
    ctx,
    `mutation Mutation($id: ID!) {
      modify: deleteTool(id: $id) {
        error {
          message
        }
        obj: tool {
          id
          staticId
        }
      }
    }`,
    { id }
  );

export const createWorkflow = (
  ctx: TestContext,
  workflowData: CreateInputWithCollection
) =>
  requestAndVerify(
    ctx,
    `mutation Mutation($workflowData: WorkflowCreateInput!) {
      modify: createWorkflow(workflowData: $workflowData) {
        error {
          message
        }
        obj: workflow {
          id
          staticId
        }
      }
    }`,
    {
      workflowData: {
        name: 'Test Workflow',
        description: 'Description',
        contents: [
          {
            type: 'paragraph',
            children: [{ text: `Workflow content` }],
          },
        ],
        keywords: [],
        branchType: BranchTypeEnum.published,
        ...workflowData,
      },
    }
  );

export const updateWorkflow = (
  ctx: TestContext,
  id: string,
  workflowData: Record<string, unknown>
) =>
  requestAndVerify(
    ctx,
    `mutation Mutation($id: ID!, $workflowData: WorkflowUpdateInput!) {
      modify: updateWorkflow(id: $id, workflowData: $workflowData) {
        error {
          message
        }
        obj: workflow {
          id
          staticId
        }
      }
    }`,
    {
      id,
      workflowData,
    }
  );

export const archiveWorkflow = (ctx: TestContext, id: string) =>
  requestAndVerify(
    ctx,
    `mutation Mutation($id: ID!) {
      modify: deleteWorkflow(id: $id) {
        error {
          message
        }
        obj: workflow {
          id
          staticId
        }
      }
    }`,
    { id }
  );

async function requestAndVerify(
  ctx: TestContext,
  query: string,
  variables: Record<string, unknown>,
  objKey = 'obj',
  mutationKey = 'modify'
) {
  const res = await ctx.client.request(query, variables);

  // Did you forget to prefix your mutation with `modify :` in your GQL query?
  expect(res).not.toBeNull();

  expect(res[mutationKey].error).toBeNull();

  const obj = res[mutationKey][objKey];
  // Did you forget to prefix your returned object with `obj :` in your GQL query?
  expect(obj).not.toBeNull();

  return obj;
}
