import { getDB } from '../../../api/db';
import { encodeId } from '../../../api/utils';
import { createTestContext, loginWithoutOrg } from '../../__helpers';
import organizationFactory from '../../helpers/factories/organization';
import userFactory from '../../helpers/factories/user';

const ctx = createTestContext();

beforeEach(async () => await getDB().authSession.deleteMany());
describe('organization', () => {
  it('returns null for shadow orgs', async () => {
    const organization = await organizationFactory.create({
      shadowRecord: true,
    });
    const user = await userFactory.create({ organizationId: organization.id });
    await loginWithoutOrg(ctx, user);

    const {
      viewer: {
        user: { organization: graphqlOrganization },
      },
    } = await ctx.client.request(`
    {
        viewer {
            user {
                id
                organization { 
                    id 
                }
            }
        }
    }
    `);

    expect(graphqlOrganization).toEqual({
      id: encodeId('org', organization.id),
    });
  });

  it('returns orgs', async () => {
    const organization = await organizationFactory.create({
      shadowRecord: false,
    });
    const user = await userFactory.create({ organizationId: organization.id });
    await loginWithoutOrg(ctx, user);

    const {
      viewer: {
        user: { organization: graphqlOrganization },
      },
    } = await ctx.client.request(`
      {
          viewer {
              user {
                  id
                  organization { 
                      id 
                  }
              }
          }
      }
      `);

    expect(graphqlOrganization).toEqual({
      id: encodeId('org', organization.id),
    });
  });
});
