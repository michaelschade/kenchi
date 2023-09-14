import { BranchTypeEnum } from '../../../src/graphql/generated';
import workflowFactory from '../../../src/test/factories/workflow';
import workflowRevisionFactory from '../../../src/test/factories/workflowRevision';
import test from '../../helpers/fixtures';

test('old workflow URLs permanent redirect to playbooks URLs', async ({
  page,
  baseURL,
}) => {
  const workflow = workflowFactory.build();
  const suggestion = workflowRevisionFactory
    .fromWorkflow(workflow)
    .withBranchId()
    .build();

  await page.goto('/workflows/new');
  await page.waitForURL(`${baseURL}/playbooks/new`);

  await page.goto(
    `/workflows/${suggestion.staticId}/merge/${suggestion.branchId}`
  );
  await page.waitForURL(
    `${baseURL}/playbooks/${suggestion.staticId}/merge/${suggestion.branchId}`
  );

  await page.goto(
    `/workflows/${suggestion.staticId}/edit/${suggestion.branchId}`
  );
  await page.waitForURL(
    `${baseURL}/playbooks/${suggestion.staticId}/edit/${suggestion.branchId}`
  );
});

test('redirects non-branch workflow view URLs to dashboard version', async ({
  page,
  baseURL,
}) => {
  const workflow = workflowFactory.build();
  await page.goto(`/playbooks/${workflow.staticId}`);
  await page.waitForURL(`${baseURL}/dashboard/playbooks/${workflow.staticId}`);
});

test('redirects branch workflow view URLs to dashboard version', async ({
  page,
  baseURL,
}) => {
  const draft = workflowFactory.build({ branchType: BranchTypeEnum.draft });

  await page.goto(`/playbooks/${draft.staticId}/${draft.branchId}`);
  await page.waitForURL(
    `${baseURL}/dashboard/playbooks/${draft.staticId}/branch/${draft.branchId}`
  );
});
