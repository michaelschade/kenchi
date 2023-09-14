import { expect } from '@playwright/test';

import { LoginMutation } from '../../src/graphql/generated';
import collectionFactory from '../../src/test/factories/collection';
import toolFactory from '../../src/test/factories/tool';
import userFactory from '../../src/test/factories/user';
import viewerFactory from '../../src/test/factories/viewer';
import test from '../helpers/fixtures';
import mockGapi from '../helpers/mockGapi';

const collection = collectionFactory.withTools([toolFactory.build()]).build();
const user = userFactory.withCollections([collection]).build();
const viewer = viewerFactory
  .associations({
    user: user,
  })
  .build();
const loginOutput: LoginMutation['modify'] = {
  __typename: 'ViewerOutput',
  error: null,
  viewer: viewer,
};

test('Successful login', async ({
  page,
  context,
  baseURL,
  mockGraphqlServer,
}) => {
  const accessToken = 'A_TOKEN';
  mockGraphqlServer.addResolvers({
    Mutation: {
      login: (_, { token }) => {
        expect(token).toBe(accessToken);
        return loginOutput;
      },
    },
    Viewer: viewer,
  });

  await context.addInitScript(mockGapi, accessToken);

  await page.goto('/login');
  await expect(page.locator('#root')).toHaveText(/Welcome to Kenchi!/);

  await page.click('button:has-text("Sign in with Google →")');
  await page.waitForURL(`${baseURL}/spaces/all`);
});
