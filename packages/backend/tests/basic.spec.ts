import type { oauth2_v2 } from 'googleapis';
import { google } from 'googleapis';

import { createTestContext } from './__helpers';

jest.mock('googleapis');

const ctx = createTestContext();

// This doesn't fully test that our error logging middleware works, since
// default middleware could expose the error name. Ideally we'd make sure Sentry
// and console.error are getting called, but there's no good way to do that with
// our testing architecture right now.
it('logs errors as expected', async () => {
  const resp = await ctx.client.request(`{ viewer { trigger500 } }`, {}, true);
  expect(resp).toMatchObject({
    data: null,
    errors: [{ message: 'Test 500' }],
  });
});

it('basic logged out request', async () => {
  const resp = await ctx.client.request(
    `{ viewer { user { id } organization { id } } }`
  );
  expect(resp).toStrictEqual({ viewer: { user: null, organization: null } });
});

it('logging in', async () => {
  // @ts-ignore
  google.auth.OAuth2.mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setCredentials: () => {},
  }));
  // @ts-ignore
  google.oauth2.mockImplementation(() => ({
    userinfo: {
      get: () => {
        const data: oauth2_v2.Schema$Userinfo = {
          email: 'brian@kenchi.com',
          hd: 'kenchi.com',
          id: '1234567890',
          name: 'Brian Krausz',
          given_name: 'Brian',
        };
        return Promise.resolve({ data });
      },
    },
  }));
  const resp = await ctx.client.request(
    `mutation LoginMutation($token: String!) {
    login(token: $token) {
      viewer {
        user {
          id
          email
          givenName
        }
        organization {
          id
          name
          shadowRecord
        }
      }
    }
  }`,
    {
      token: 'test_token',
    }
  );
  expect(resp).toMatchObject({
    login: {
      viewer: {
        user: { email: 'brian@kenchi.com', givenName: 'Brian' },
        organization: {
          shadowRecord: true,
        },
      },
    },
  });
});
