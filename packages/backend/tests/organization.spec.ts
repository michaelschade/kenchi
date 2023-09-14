import { createTestContext, loginWithoutOrg } from './__helpers';

const ctx = createTestContext();

async function createOrg() {
  const { createOrganization } = await ctx.client.request(
    `mutation Mutation {
      createOrganization {
        viewer {
          organization {
            id
            name
            collections(first: 2) {
              edges {
                node {
                  id
                  name
                  workflows(first: 2) {
                    edges {
                      node {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
        error {
          message
        }
      }
    }`
  );

  expect(createOrganization).toMatchObject({
    viewer: {
      organization: {
        name: null,
        collections: {
          edges: [{ node: { name: 'Shared' } }],
        },
      },
    },
    error: null,
  });

  const org = createOrganization.viewer.organization;

  expect(org.collections.edges.length).toBe(1);

  return org;
}

it('updates org details and deletes Shared collection', async () => {
  const userId = await loginWithoutOrg(ctx);
  await createOrg();

  const { createCollection } = await ctx.client.request(
    `mutation Mutation($data: CollectionInput!) {
      createCollection(collectionData: $data) {
        collection {
          id
        }
        error {
          message
        }
      }
    }`,
    {
      data: {
        name: 'TestAddOrg',
        description: '',
        acl: [{ userId, permissions: ['admin'] }],
      },
    }
  );
  expect(createCollection.error).toBe(null);
  const collectionId = createCollection.collection.id;

  const { updateOrganization } = await ctx.client.request(
    `mutation Mutation($collectionsToShare: [ID!]!) {
      updateOrganization(name: "Foo", useGoogleDomain: false, collectionsToShare: $collectionsToShare) {
        organization {
          id
          name
          collections(first: 2) {
            edges {
              node {
                id
              }
            }
          }
        }
        error {
          message
        }
      }
    }`,
    { collectionsToShare: [collectionId] }
  );
  expect(updateOrganization).toMatchObject({
    organization: {
      name: 'Foo',
      collections: {
        edges: [{ node: { id: collectionId } }],
      },
    },
    error: null,
  });
});

it('does not delete Shared collection if it has changes', async () => {
  const userId = await loginWithoutOrg(ctx);
  const org = await createOrg();

  const sharedCollectionId = org.collections.edges[0].node.id;
  const sharedWorkflowId =
    org.collections.edges[0].node.workflows.edges[0].node.id;
  const { updateWorkflow } = await ctx.client.request(
    `mutation Mutation($id: ID!, $data: WorkflowUpdateInput!) {
      updateWorkflow(id: $id, workflowData: $data) {
        workflow {
          id
        }
        error {
          message
        }
      }
    }`,
    { id: sharedWorkflowId, data: { name: 'UpdatedName' } }
  );
  expect(updateWorkflow.error).toBe(null);

  const { createCollection } = await ctx.client.request(
    `mutation Mutation($data: CollectionInput!) {
      createCollection(collectionData: $data) {
        collection {
          id
        }
        error {
          message
        }
      }
    }`,
    {
      data: {
        name: 'TestAddOrg',
        description: '',
        acl: [{ userId, permissions: ['admin'] }],
      },
    }
  );
  expect(createCollection.error).toBe(null);
  const collectionId = createCollection.collection.id;

  const { updateOrganization } = await ctx.client.request(
    `mutation Mutation($collectionsToShare: [ID!]!) {
      updateOrganization(name: "Foo", useGoogleDomain: false, collectionsToShare: $collectionsToShare) {
        organization {
          id
          name
          collections(first: 3) {
            edges {
              node {
                id
              }
            }
          }
        }
        error {
          message
        }
      }
    }`,
    { collectionsToShare: [collectionId] }
  );
  expect(updateOrganization).toMatchObject({
    organization: {
      name: 'Foo',
      collections: {
        edges: expect.arrayContaining([
          { node: { id: collectionId } },
          { node: { id: sharedCollectionId } },
        ]),
      },
    },
    error: null,
  });
  expect(updateOrganization.organization.collections.edges.length).toBe(2);
});

it('does not delete Shared collection if not sharing other collections', async () => {
  await loginWithoutOrg(ctx);
  const org = await createOrg();
  const sharedCollectionId = org.collections.edges.find(
    (e: any) => e.node.name === 'Shared'
  ).node.id;

  const { updateOrganization } = await ctx.client.request(
    `mutation Mutation {
      updateOrganization(name: "Foo", useGoogleDomain: false, collectionsToShare: []) {
        organization {
          id
          name
          collections(first: 2) {
            edges {
              node {
                id
              }
            }
          }
        }
        error {
          message
        }
      }
    }`
  );
  expect(updateOrganization).toMatchObject({
    organization: {
      name: 'Foo',
      collections: {
        edges: [{ node: { id: sharedCollectionId } }],
      },
    },
    error: null,
  });
  expect(updateOrganization.organization.collections.edges.length).toBe(1);
});
