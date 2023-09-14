import { merge } from 'lodash';

import collectionFactory from '../../../src/test/factories/collection';
import spaceFactory from '../../../src/test/factories/space';
import toolFactory from '../../../src/test/factories/tool';
import userFactory from '../../../src/test/factories/user';
import { hitsFor } from '../../../src/test/helpers/algoliaHit';
import test from '../../helpers/fixtures';

const collection = collectionFactory.build({ name: 'Test collection' });
const collectionInSpace = collectionFactory.build({
  name: 'Test collection in a space',
});
const space = spaceFactory.containingCollections([collectionInSpace]).build();

const user = userFactory
  .withCollections([collection, collectionInSpace])
  .withSpaces([space])
  .build();

test.beforeAll(({ mockGraphqlServer }) => {
  mockGraphqlServer.addMocks({ ToolLatest: toolFactory.build() });
  mockGraphqlServer.addResolvers({
    Viewer: {
      user: () => user,
      organization: () => null,
      searchConfig: () => ({
        apiKey: 'mock_algolia_api_key',
        appId: 'mock-algolia-app-id',
        indexName: 'mock_algolia_index_name',
        shouldUseAlgolia: true,
        lastUpdated: Date.now(),
        apiKeyExpiration: new Date(Date.now() + 1800000),
      }),
    },
  });
});

test('searching within spaces', async ({
  page,
  baseURL,
  mockSearchResults,
}) => {
  // Switch to a specific space, then show results in all spaces and switch
  // back to just results within the current space. Search query in the URL
  // should update accordingly
  page.goto('/spaces/all');
  await page.locator('button:has-text("Show everything")').click();
  await page.locator(`text=${space.name}`).click();

  // Searching within the space
  merge(mockSearchResults, { 'test collection': hitsFor([collectionInSpace]) });
  page.fill('[placeholder="Search"]', 'test collection');
  await page.waitForURL(
    `${baseURL}/spaces/${space.staticId}?search=${encodeURIComponent(
      'test collection'
    )}`
  );

  // Viewing results across all spaces
  merge(mockSearchResults, {
    'test collection': hitsFor([collection, collectionInSpace]),
  });
  await page.locator('button:has-text("in this space")').click();
  await page.locator('text=everywhere').click();
  await page.waitForURL(
    `${baseURL}/spaces/${space.staticId}?search=${encodeURIComponent(
      'test collection'
    )}&searchAll=true`
  );

  // Scope back down to just the current space
  merge(mockSearchResults, { 'test collection': hitsFor([collectionInSpace]) });
  await page.locator('button:has-text("everywhere")').click();
  await page.locator('text=in this space').click();
  await page.waitForURL(
    `${baseURL}/spaces/${space.staticId}?search=${encodeURIComponent(
      'test collection'
    )}`
  );
});
