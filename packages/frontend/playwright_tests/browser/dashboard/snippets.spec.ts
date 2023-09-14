import { expect } from '@playwright/test';

import collectionFactory from '../../../src/test/factories/collection';
import toolFactory from '../../../src/test/factories/tool';
import userFactory from '../../../src/test/factories/user';
import test from '../../helpers/fixtures';

const tools = toolFactory.buildList(21);
const user = userFactory.build({
  collections: {
    edges: [
      {
        node: collectionFactory.withTools(tools).build(),
        __typename: 'CollectionEdge',
      },
    ],
  },
});

test.beforeAll(({ mockGraphqlServer }) => {
  mockGraphqlServer.addResolvers({
    Viewer: {
      user: () => user,
    },
  });
});

test('paginating results', async ({ page }) => {
  await page.goto('/dashboard/snippets');

  await expect(page.locator(`text=Page 1 of 2`)).toBeVisible();
  for (const tool of tools.slice(0, 20)) {
    await expect(page.locator(`text=${tool.name}`)).toBeVisible();
  }
  await expect(page.locator(`text=${tools[20].name}`)).not.toBeVisible();

  await page.click('text=Next');

  await expect(page.locator(`text=Page 2 of 2`)).toBeVisible();
  await expect(page.locator(`text=${tools[20].name}`)).toBeVisible();
  for (const tool of tools.slice(0, 20)) {
    await expect(page.locator(`text=${tool.name}`)).not.toBeVisible();
  }
});

test('filter change resets pagination', async ({ page, baseURL }) => {
  // When not on the first page of results, adding a filter can reduce the total
  // pages. As the list of results are filtered on-the-fly, the correct page number should
  // be displayed. When the filter is set and updates the URL, pagination should reset to the first page of results.
  await page.goto('/dashboard/snippets');

  await page.click('text=Next');

  await page.click('button:has-text("Filter")');
  await page.click('button:has-text("Name")');

  const snippetName = tools[0].name;
  await page.fill('[placeholder="Search"]', snippetName);
  await expect(page.locator(`text=Page 1 of 1`)).toBeVisible();
  await expect(page.locator(`table:has-text("${snippetName}")`)).toBeVisible();

  // The filter isn't really 'set' until the filter widget is closed,
  // clicking on the filter button again will close the filter and update
  // the URL with the filter text
  await page.click('button:has-text("Filter | 1")');

  // New filter synced to the URL and pagination cleared/reset
  await page.waitForURL(`${baseURL}/dashboard/snippets?name=${snippetName}`);
});

test('sort change resets pagination', async ({ page, baseURL }) => {
  // When not on the first page of results, adding a filter can reduce the total
  // pages. As the list of results are filtered on-the-fly, the correct page number should
  // be displayed. When the filter is set and updates the URL, pagination should reset to the first page of results.
  await page.goto('/dashboard/snippets');

  await page.click('text=Next');

  // Reverse the name sort order
  await page.click('th:has-text("Name")');

  // Pagination cleared/reset
  await page.waitForURL(
    `${baseURL}/dashboard/snippets?sortBy=name&sortDir=desc`
  );

  // The last tool, previously on the second page, should be visible.
  await expect(page.locator(`text=${tools[20].name}`)).toBeVisible();
});

test('tab change resets pagination', async ({ page, baseURL }) => {
  await page.goto('/dashboard/snippets');

  await page.click('text=Next');

  // Switch to the drafts tabv
  await page.click('button:has-text("Drafts")');

  // Pagination cleared/reset
  await page.waitForURL(`${baseURL}/dashboard/snippets?tab=drafts`);
});

// TODO: These tests don't belong here, but I'm unable to test inital
// URLs with query strings in the jest tests. Once that's fixed, these tests
// might be able to move to the component level.
test('invalid page numbers redirect to reasonable values', async ({
  page,
  baseURL,
}) => {
  // Pages <1 start with the first page
  await page.goto('/dashboard/snippets?page=0');
  await page.waitForURL(`${baseURL}/dashboard/snippets`);
  await page.goto('/dashboard/snippets?page=-1');
  await page.waitForURL(`${baseURL}/dashboard/snippets`);
  await page.goto('/dashboard/snippets?page=meow');
  await page.waitForURL(`${baseURL}/dashboard/snippets`);
  // TODO: What's the best way to not do this max page comparison as data is
  // changing on-the-fly when a user is typing in a filter?
  // https://app.asana.com/0/1167661969173411/1201659155521471/f
  // Pages >last page start with the last page
  // await page.goto('/dashboard/snippets?page=3');
  // await page.waitForURL(`${baseURL}/dashboard/snippets?page=2`);
});
