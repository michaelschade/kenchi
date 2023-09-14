import { BranchTypeEnum } from '../../../src/graphql/generated';
import toolFactory from '../../../src/test/factories/tool';
import toolRevisionFactory from '../../../src/test/factories/toolRevision';
import test from '../../helpers/fixtures';

test('old tool URLs permanent redirect to snippet URLs', async ({
  page,
  baseURL,
}) => {
  const tool = toolFactory.build();
  const suggestion = toolRevisionFactory.fromTool(tool).withBranchId().build();

  await page.goto('/tools/new');
  await page.waitForURL(`${baseURL}/snippets/new`);

  await page.goto(`/tools/${suggestion.staticId}/merge/${suggestion.branchId}`);
  await page.waitForURL(
    `${baseURL}/snippets/${suggestion.staticId}/merge/${suggestion.branchId}`
  );

  await page.goto(`/tools/${suggestion.staticId}/edit/${suggestion.branchId}`);
  await page.waitForURL(
    `${baseURL}/snippets/${suggestion.staticId}/edit/${suggestion.branchId}`
  );
});

test('redirects non-branch tool view URLs to dashboard version', async ({
  page,
  baseURL,
}) => {
  const tool = toolFactory.build();
  await page.goto(`/snippets/${tool.staticId}`);
  await page.waitForURL(`${baseURL}/dashboard/snippets/${tool.staticId}`);
});

test('redirects branch tool view URLs to dashboard version', async ({
  page,
  baseURL,
}) => {
  const draft = toolFactory.build({ branchType: BranchTypeEnum.draft });

  await page.goto(`/snippets/${draft.staticId}/${draft.branchId}`);
  await page.waitForURL(
    `${baseURL}/dashboard/snippets/${draft.staticId}/branch/${draft.branchId}`
  );
});
