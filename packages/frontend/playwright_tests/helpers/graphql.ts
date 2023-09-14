import { addMocksToSchema, IMocks, IMockServer } from '@graphql-tools/mock';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { IResolvers } from '@graphql-tools/utils';
import { BrowserContext, Page, Request } from '@playwright/test';
import fs from 'fs';
import { graphql } from 'graphql';
import path from 'path';

// Fixture for a mock graphql server. This server generates responses for all graphql API calls
// in specs that use this fixture.
export class MockableGraphqlServer {
  constructor(
    private graphqlMocks: IMocks = {
      Json: () => ({}),
      InsertionPath: () => ({}),
      ToolInput: () => ({}),
      ToolConfiguration: () => ({}),
      DateTime: () => '2021-01-01T00:00:00.000Z',
    },
    private graphqlResolvers: IResolvers = {},
    private mockServer: IMockServer = null
  ) {}
  buildMockServer(): IMockServer {
    const baseSchema = makeExecutableSchema({
      typeDefs: fs.readFileSync(
        path.join(__dirname, '../../../backend/api.graphql'),
        'utf8'
      ),
    });
    const mockedSchema = addMocksToSchema({
      schema: baseSchema,
      mocks: this.graphqlMocks,
      resolvers: this.graphqlResolvers,
      preserveResolvers: false,
    });

    return {
      query: (query, vars) =>
        graphql({
          schema: mockedSchema,
          source: query,
          rootValue: {},
          contextValue: {},
          variableValues: vars,
        }),
    };
  }
  server(): IMockServer {
    if (!this.mockServer) this.mockServer = this.buildMockServer();
    return this.mockServer;
  }

  addMocks(mocks: IMocks): void {
    this.graphqlMocks = { ...this.graphqlMocks, ...mocks };
    if (this.mockServer) {
      console.warn('Warning: updating mocks for an existing mock server');
      this.mockServer = this.buildMockServer();
    }
  }

  addResolvers(resolvers: IResolvers): void {
    this.graphqlResolvers = { ...this.graphqlResolvers, ...resolvers };
    if (this.mockServer) {
      console.warn('Warning: updating resolvers for an existing mock server');
      this.mockServer = this.buildMockServer();
    }
  }
}

const parseGraphqlOperation = (
  request: Request
): {
  query: string;
  operationName: string | undefined;
  variables: Object;
} => {
  const rawRostData = request.postData();
  if (rawRostData) {
    const decodedPostDate = decodeURIComponent(rawRostData);
    return JSON.parse(decodedPostDate);
  } else {
    const urlParams = new URL(request.url()).searchParams;
    const operation = {
      query: urlParams.get('query'),
      operationName: urlParams.get('operationName'),
      variables: JSON.parse(urlParams.get('variables')),
    };
    return operation;
  }
};

// Graphql interception relies on persisted queries being disabled so that
// there is always a fully specified query body.
export const interceptGraphqlQueries = async (
  routable: BrowserContext | Page,
  mockServer: MockableGraphqlServer
): Promise<void> => {
  return routable.route(
    'https://api.kenchi.dev/graphql*',
    async (route, request) => {
      const origin = await request.headerValue('origin');
      const operation = parseGraphqlOperation(request);

      const result = await mockServer
        .server()
        .query(operation.query, operation.variables);
      const responseJson = JSON.stringify(result);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'X-Playwright-Graphql-Mock': 'true',
        },
        body: responseJson,
      });
    }
  );
};
