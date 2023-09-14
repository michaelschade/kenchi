import { every } from 'lodash';
import { Organization, User } from 'prisma-client';

import { getDB } from '../../../api/db';
import { createTestContext, loginWithoutOrg } from '../../__helpers';
import collectionFactory from '../../helpers/factories/collection';
import dataSourceFactory from '../../helpers/factories/dataSource';
import organizationFactory from '../../helpers/factories/organization';
import userFactory from '../../helpers/factories/user';

const ctx = createTestContext();

describe('Creating an organization', () => {
  async function createOrg() {
    return ctx.client.request(
      `mutation Mutation {
            createOrganization {
                viewer {
                    organization {
                        id
                        collections(first: 20) {
                            edges {
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
                error {
                    message
                }
            }
        }
    `
    );
  }

  let organization: Organization;
  let user: User;
  beforeEach(async () => {
    organization = await organizationFactory.create({
      shadowRecord: true,
    });
    user = await userFactory.create({ organizationId: organization.id });
    await loginWithoutOrg(ctx, user);
  });

  it('converts the org to a non-shadow org', async () => {
    const {
      createOrganization: { error },
    } = await createOrg();

    expect(error).toBeNull();
    const updatedOrganization = await getDB().organization.findUnique({
      where: { id: organization.id },
    });
    expect(updatedOrganization!.shadowRecord).toBe(false);
  });

  it('creates a new shared collection', async () => {
    const {
      createOrganization: { viewer },
    } = await createOrg();
    expect(viewer).toMatchObject({
      organization: {
        collections: {
          edges: [{ node: { name: 'Shared' } }],
        },
      },
    });
  });

  it(`converts the user's collections to org collections`, async () => {
    await collectionFactory.createList(3, {
      acl: { create: { userId: user.id, permissions: ['admin'] } },
    });

    const {
      createOrganization: {
        viewer: {
          organization: { id },
        },
      },
    } = await createOrg();

    const {
      viewer: {
        user: {
          collections: { edges: collectionNodes },
        },
      },
    } = await ctx.client.request(`
      {
        viewer {
          user {
            collections(first: 20) {
              edges {
                node {
                  id
                  name
                  organization {
                    id
                  }
                }
              }
            }
          }
        }
      }
      `);

    every(collectionNodes, ({ node }) =>
      expect(node.organization.id).toEqual(id)
    );
  });

  it('does not let a user create another org', async () => {
    await createOrg();
    const {
      createOrganization: { error },
    } = await createOrg();
    expect(error.message).toEqual(
      `You're already a member of an organization, you cannot create another one.`
    );
  });
});

describe('Data sources', () => {
  it('returns unarchived data sources', async () => {
    const organization = await organizationFactory.create();
    const user = await userFactory.create({
      organizationId: organization.id,
    });
    const dataSource = await dataSourceFactory.create({
      organizationId: organization.id,
    });
    const _archivedDataSource = await dataSourceFactory.create({
      organizationId: organization.id,
      isArchived: true,
    });
    await loginWithoutOrg(ctx, user);

    const {
      viewer: {
        organization: { dataSources },
      },
    } = await ctx.client.request(`
      {
        viewer {
          organization {
            id
            dataSources {
              id
            }
          }
        }
      }
    `);
    expect(dataSources).toContainEqual({ id: dataSource.id });
  });
});
