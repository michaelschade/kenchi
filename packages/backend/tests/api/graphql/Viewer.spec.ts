import { getDB } from '../../../api/db';
import { makeSearchKeyForUser } from '../../../api/search/searcher';
import { decodeId, encodeId } from '../../../api/utils';
import { createTestContext, loginWithoutOrg, mockAuth } from '../../__helpers';
import organizationFactory from '../../helpers/factories/organization';
import userFactory from '../../helpers/factories/user';

jest.mock('../../../api/search/searcher');
const mockMakeSearchApiKeyForUser = makeSearchKeyForUser as jest.MockedFunction<
  typeof makeSearchKeyForUser
>;
const ctx = createTestContext();

beforeEach(async () => await getDB().authSession.deleteMany());
describe('auto-creating a user on first login', () => {
  it('creates a user with a shadow org', async () => {
    mockAuth(ctx);

    const {
      login: {
        viewer: {
          user: { id: graphqlUserId, organization: graphqlOrganization },
        },
      },
    } = await ctx.client.request(
      `mutation LoginMutation($token: String!) {
          login(token: $token) {
            viewer {
              user {
                id
                organization {
                  id
                  shadowRecord  
                }
              }
            }
          }
        }`,
      {
        token: 'test_token',
      }
    );

    const [_, userId] = decodeId(graphqlUserId);
    const user = await getDB().user.findUnique({ where: { id: userId } });
    // Auto-create shadow org and mark the user as an org admin
    expect(user?.isOrganizationAdmin).toBe(true);
    expect(graphqlOrganization).toMatchObject({ shadowRecord: true });

    const organization = await getDB().organization.findUnique({
      where: { id: user!.organizationId! },
    });
    expect(organization!.shadowRecord).toBe(true);
  });

  it('uses an existing organization if it matches the hosted domain', async () => {
    const organization = await organizationFactory.create({
      googleDomain: 'panteras-kitten-casbah.com',
    });
    mockAuth(ctx, { oauthData: { hd: 'panteras-kitten-casbah.com' } });

    const {
      login: {
        viewer: {
          user: { id: graphqlUserId, organization: graphqlOrganization },
        },
      },
    } = await ctx.client.request(
      `mutation LoginMutation($token: String!) {
          login(token: $token) {
            viewer {
              user {
                id
                organization {
                  id
                }
              }
            }
          }
        }`,
      {
        token: 'test_token',
      }
    );

    const [_, userId] = decodeId(graphqlUserId);
    const user = await getDB().user.findUnique({ where: { id: userId } })!;
    expect(user!.isOrganizationAdmin).toBe(false);
    expect(graphqlOrganization.id).toEqual(encodeId('org', organization.id));
  });
});

describe('search config', () => {
  it('returns null for a logged out user', async () => {
    const {
      viewer: { searchConfig },
    } = await ctx.client.request(`
      {
        viewer {
          searchConfig {
            apiKey
          }
        }
      }
    `);

    expect(searchConfig).toBeNull();
  });

  it('returns the search config for a logged in user', async () => {
    const user = await userFactory.create();

    const resolvedId = await loginWithoutOrg(ctx, user);

    const expectedSearchApiKey = `restricted_key_for_user_${resolvedId}`;
    mockMakeSearchApiKeyForUser.mockResolvedValue(expectedSearchApiKey);
    const {
      viewer: {
        searchConfig: { apiKey },
      },
    } = await ctx.client.request(`
      {
        viewer {
          searchConfig {
            apiKey
          }
        }
      }
    `);

    expect(mockMakeSearchApiKeyForUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id })
    );
    expect(apiKey).toEqual(expectedSearchApiKey);
  });
});
