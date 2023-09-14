import { getDB } from '../../../api/db';
import { createTestContext, loginWithoutOrg } from '../../__helpers';
import dataSourceFactory from '../../helpers/factories/dataSource';
import organizationFactory from '../../helpers/factories/organization';
import userFactory from '../../helpers/factories/user';

let ctx = createTestContext();
const DATA_SOURCE_CREATE_MUTATION = `mutation Mutation($data: DataSourceCreateInput!) {
  createDataSource(data: $data) {
      dataSource {
          id
          requests
          outputs
          name
      }
      error {
          message
      }
  }
}`;
const DATA_SOURCE_UPDATE_MUTATION = `mutation Mutation($id: ID!, $data: DataSourceUpdateInput!) {
  updateDataSource(id: $id, data: $data) {
      dataSource {
          id
          name
          requests
          outputs
      }
      error {
          message
      }
  }
}`;

const data = {
  id: 'ds_1',
  name: 'Data Source 1',
  requests: [
    {
      id: 'req_123',
      type: 'networkRequest',
      url: { type: 'text', text: 'https://example.com' },
      queryParams: {},
      headers: {},
    },
  ],
  outputs: [
    {
      id: 'out_123',
      name: 'Meowtput',
      value: { type: 'request', requestId: 'req_123', path: ['data', 'meow'] },
    },
  ],
};

async function createUser({
  shadowRecord,
  isOrganizationAdmin = true,
}: {
  shadowRecord: boolean;
  isOrganizationAdmin?: boolean;
}) {
  const organization = await organizationFactory.create({
    shadowRecord,
  });
  const user = await userFactory.create({
    organizationId: organization.id,
    isOrganizationAdmin,
  });
  return { user, organization };
}
let db: ReturnType<typeof getDB>;
beforeEach(async () => {
  db = getDB();
  db.authSession.deleteMany();
});

it.each([true, false])(
  'creates a data source for the organization when shadow record is %p',
  async (shadowRecord) => {
    const { user } = await createUser({
      shadowRecord,
      isOrganizationAdmin: true,
    });
    await loginWithoutOrg(ctx, user);
    const {
      createDataSource: {
        dataSource: { id, name, requests, outputs },
      },
    } = await ctx.client.request(DATA_SOURCE_CREATE_MUTATION, {
      data,
    });

    expect(name).toEqual(data.name);
    expect(requests).toEqual(data.requests);
    expect(outputs).toEqual(data.outputs);

    const dataSource = await db.dataSource.findUnique({ where: { id } });
    expect(dataSource!.organizationId).toEqual(user.organizationId);
  }
);

it('only allows organization admins to create data sources', async () => {
  const { user } = await createUser({
    shadowRecord: false,
    isOrganizationAdmin: false,
  });
  await loginWithoutOrg(ctx, user);
  await expect(
    ctx.client.request(DATA_SOURCE_CREATE_MUTATION, {
      data,
    })
  ).resolves.toMatchObject({ createDataSource: { error: expect.anything() } });
});

it('updates a data source', async () => {
  const { user, organization } = await createUser({
    shadowRecord: false,
    isOrganizationAdmin: true,
  });
  const dataSource = await dataSourceFactory.create({
    organizationId: organization.id,
  });
  const updateData = {
    name: 'Updated Names',
    requests: [
      {
        id: 'req_234',
        type: 'networkRequest',
        url: { type: 'text', text: 'https://example.com/updated' },
        queryParams: {},
        headers: {},
      },
    ],
    outputs: [
      {
        id: 'out_123',
        name: 'Meowtput Updated',
        value: {
          type: 'request',
          requestId: 'req_234',
          path: ['data', 'meow_updated'],
        },
      },
    ],
  };

  await loginWithoutOrg(ctx, user);
  const {
    updateDataSource: {
      dataSource: { name, requests, outputs },
    },
  } = await ctx.client.request(DATA_SOURCE_UPDATE_MUTATION, {
    id: dataSource.id,
    data: updateData,
  });

  expect(name).toEqual(updateData.name);
  expect(requests).toEqual(updateData.requests);
  expect(outputs).toEqual(updateData.outputs);
});

it('does not mutate unspecified keys', async () => {
  const { user, organization } = await createUser({
    shadowRecord: false,
    isOrganizationAdmin: true,
  });
  const dataSource = await dataSourceFactory.create({
    organizationId: organization.id,
    ...data,
  });

  const updateData = {
    name: 'Updated Names',
    requests: [
      {
        id: 'req_123',
        type: 'networkRequest',
        url: { type: 'text', text: 'https://example.com/updated' },
        queryParams: {},
        headers: {},
      },
    ],
  };

  await loginWithoutOrg(ctx, user);
  const {
    updateDataSource: {
      dataSource: { name, requests, outputs },
    },
  } = await ctx.client.request(DATA_SOURCE_UPDATE_MUTATION, {
    id: dataSource.id,
    data: updateData,
  });

  expect(name).toEqual(updateData.name);
  expect(requests).toEqual(updateData.requests);
  expect(outputs).toEqual(data.outputs); // unchanged from the original data
});

it('only allows organization admins to update requests', async () => {
  const { user, organization } = await createUser({
    shadowRecord: false,
    isOrganizationAdmin: false,
  });
  const dataSource = await dataSourceFactory.create({
    organizationId: organization.id,
  });
  const updateData = {
    requests: [{ currently: 'updated bs' }],
  };

  await loginWithoutOrg(ctx, user);
  await expect(
    ctx.client.request(DATA_SOURCE_UPDATE_MUTATION, {
      id: dataSource.id,
      data: updateData,
    })
  ).resolves.toMatchObject({ updateDataSource: { error: expect.anything() } });
});

it('allows non-admins to update outputs', async () => {
  const { user, organization } = await createUser({ shadowRecord: false });
  const dataSource = await dataSourceFactory.create({
    organizationId: organization.id,
  });
  const updateData = {
    outputs: [{ currently: 'also updated bs' }],
  };

  await loginWithoutOrg(ctx, user);
  const {
    updateDataSource: {
      dataSource: { outputs },
    },
  } = await ctx.client.request(DATA_SOURCE_UPDATE_MUTATION, {
    id: dataSource.id,
    data: updateData,
  });

  expect(outputs).toEqual(updateData.outputs);
});

it('archives a dataSource', async () => {
  const { user, organization } = await createUser({ shadowRecord: false });
  const dataSource = await dataSourceFactory.create({
    organizationId: organization.id,
  });
  await loginWithoutOrg(ctx, user);
  await ctx.client.request(
    `mutation Mutation($id: ID!) {
          archiveDataSource(id: $id) {
              dataSource {
                  id
              }
              error {
                  message
              }
          }
      }`,
    {
      id: dataSource.id,
    }
  );

  const archivedDataSource = await db.dataSource.findUnique({
    where: { id: dataSource.id },
  });
  expect(archivedDataSource!.isArchived).toEqual(true);
});
