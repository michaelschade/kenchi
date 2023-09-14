import { createTestContext, loginAndCreateOrg } from './__helpers';

const ctx = createTestContext();

it('add user', async () => {
  await loginAndCreateOrg(ctx);

  const resp = await ctx.client.request(`mutation Mutation {
    createUser(email: "test@example.com", groupIds: []) {
      user {
        email
        groups {
          id
        }
      }
      error {
        message
      }
    }
  }`);
  expect(resp).toMatchObject({
    createUser: {
      user: {
        email: 'test@example.com',
      },
      error: null,
    },
  });
});
