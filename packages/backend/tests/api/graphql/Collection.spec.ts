import { decodeId } from '../../../api/utils';
import {
  createTestContext,
  loginAndCreateOrg,
  loginWithoutOrg,
} from '../../__helpers';
import { clearMockQueue, mockQueue as queue } from '../../__mocks__/bull';

const ctx = createTestContext();
const jobName = 'collectionMutation';

async function createCollection(data: Record<string, unknown>) {
  return await ctx.client.request(
    `mutation Mutation($data: CollectionInput!) {
    createCollection(collectionData: $data) {
      collection {
        id
        organization {
          id
        }
      }
      error {
        message
      }
    }
  }`,
    {
      data,
    }
  );
}

describe('CRUD side-effects', () => {
  beforeEach(() => {
    clearMockQueue();
  });
  it('enqueues a job on create', async () => {
    const userId = await loginWithoutOrg(ctx);
    const response = await createCollection({
      name: 'Test Create',
      description: '',
      acl: [{ userId, permissions: ['admin'] }],
    });

    const collectionId = response.createCollection.collection.id;

    expect(queue).toContainEqual({
      name: jobName,
      collectionId: decodeId(collectionId)[1],
      action: 'create',
    });
  });

  it('enqueues a job on update', async () => {
    const userId = await loginWithoutOrg(ctx);
    const createResponse = await createCollection({
      name: 'New Collection',
      description: '',
      acl: [{ userId, permissions: ['admin'] }],
    });

    const collectionId = createResponse.createCollection.collection.id;
    await ctx.client.request(
      `mutation Mutation($id: ID!, $data: CollectionInput!) {
        updateCollection(id: $id, collectionData: $data) {
          collection {
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
            description
          }
          error {
            message
          }
        }
      }`,
      {
        id: collectionId,
        data: {
          name: 'Test Update',
          defaultPermissions: ['viewer'],
          acl: [{ userId: userId, permissions: ['admin'] }],
          description: '',
        },
      }
    );

    expect(queue).toContainEqual({
      name: jobName,
      collectionId: decodeId(collectionId)[1],
      action: 'update',
    });
  });
  it('enqueues a job on delete', async () => {
    const userId = await loginWithoutOrg(ctx);
    const createResponse = await createCollection({
      name: 'New Collection',
      description: '',
      acl: [{ userId, permissions: ['admin'] }],
    });
    const collectionId = createResponse.createCollection.collection.id;
    await ctx.client.request(
      `mutation Mutation($id: ID!) {
        archiveCollection(id: $id) {
          collection {
            id
          }
          error {
            message
          }
        }
      }`,
      {
        id: collectionId,
      }
    );

    expect(queue).toContainEqual({
      name: jobName,
      collectionId: decodeId(collectionId)[1],
      action: 'delete',
    });
  });
});

describe('creating collections', () => {
  it('creates collections without an org for users with a shadow org', async () => {
    const userId = await loginWithoutOrg(ctx);
    const {
      createCollection: {
        collection: { organization },
      },
    } = await createCollection({
      name: 'Test Create',
      description: '',
      acl: [{ userId, permissions: ['admin'] }],
    });

    expect(organization).toBeNull();
  });

  it('creates collections with an org for users with an org', async () => {
    const [userId, _, organizationId] = await loginAndCreateOrg(ctx);
    const {
      createCollection: {
        collection: { organization },
      },
    } = await createCollection({
      name: 'Test Create',
      description: '',
      acl: [{ userId, permissions: ['admin'] }],
    });

    expect(organization.id).toEqual(organizationId);
  });
});
