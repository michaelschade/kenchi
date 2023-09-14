import {
  createCollection,
  createTestContext,
  loginAndCreateOrg,
} from './__helpers';

const ctx = createTestContext();

async function getUsers() {
  const queryResp = await ctx.client.request(`query Query {
    viewer {
      organization {
        users(first: 100) {
          edges {
            node {
              id
              email
            }
          }
        }
        userGroups(first: 100) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  }`);

  const users = queryResp?.viewer?.organization?.users?.edges;
  expect(users?.length).toBe(1);

  return users.map((u: any) => u.node);
}

async function createGroup(name: string) {
  const queryResp = await ctx.client.request(
    `mutation Mutation($name: String!) {
      createGroup(name: $name) {
        group {
          id
          name
        }
      }
    }`,
    { name }
  );

  const group = queryResp?.createGroup?.group;
  expect(group).not.toBe(null);

  return group;
}

it('create collection', async () => {
  await loginAndCreateOrg(ctx);
  const group = await createGroup('test');
  expect(group.id).toEqual(expect.stringContaining('ugrp_'));

  const collection = await createCollection(ctx, {
    name: 'TestCreateCollection',
    acl: [{ userGroupId: group.id, permissions: ['viewer'] }],
    defaultPermissions: [],
    description: '',
  });
  expect(collection).toMatchObject({
    name: 'TestCreateCollection',
    defaultPermissions: [],
    acl: [{ userGroup: { id: group.id }, user: null, permissions: ['viewer'] }],
  });
});

it('adds user to ACL if they otherwise would not have admin bits', async () => {
  const [userId] = await loginAndCreateOrg(ctx);
  const collection = await createCollection(ctx, {
    name: 'TestCreateCollection',
    acl: [],
    defaultPermissions: ['publisher'],
    description: '',
  });
  expect(collection).toMatchObject({
    acl: [{ user: { id: userId }, userGroup: null, permissions: ['admin'] }],
  });
});

it('update collection acl', async () => {
  await loginAndCreateOrg(ctx);
  const users = await getUsers();
  const group1 = await createGroup('test1');
  const group2 = await createGroup('test2');

  const collection = await createCollection(ctx, {
    name: 'TestUpdateCollectionACL',
    acl: [
      { userGroupId: group1.id, permissions: ['viewer'] },
      { userId: users[0].id, permissions: ['publisher'] },
    ],
    defaultPermissions: [],
    description: '',
  });
  const collectionId = collection.id;
  expect(collectionId).toEqual(expect.stringContaining('coll_'));

  const resp = await ctx.client.request(
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
        name: 'Test',
        defaultPermissions: ['viewer'],
        acl: [
          { userGroupId: group2.id, permissions: ['viewer'] },
          { userId: users[0].id, permissions: ['admin'] },
        ],
        description: '',
      },
    }
  );
  expect(resp).toMatchObject({
    updateCollection: {
      collection: {
        acl: expect.arrayContaining([
          { userGroup: { id: group2.id }, user: null, permissions: ['viewer'] },
          {
            userGroup: null,
            user: { id: users[0].id },
            permissions: ['admin'],
          },
        ]),
      },
      error: null,
    },
  });
  expect(resp.updateCollection.collection.acl.length).toBe(2);
});
