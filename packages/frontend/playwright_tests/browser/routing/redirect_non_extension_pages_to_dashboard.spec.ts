import toolFactory from '../../../src/test/factories/tool';
import workflowFactory from '../../../src/test/factories/workflow';
import test from '../../helpers/fixtures';

const tool = toolFactory.build();
const workflow = workflowFactory.build();

test('when not within the extension redirect snippets to the dashboard', async ({
  page,
  baseURL,
}) => {
  await page.goto(`/snippets/${tool.staticId}`);
  await page.waitForURL(`${baseURL}/dashboard/snippets/${tool.staticId}`);
});

test('when not within the extension redirect workflows to the dashboard', async ({
  page,
  baseURL,
}) => {
  await page.goto(`/playbooks/${workflow.staticId}`);
  await page.waitForURL(`${baseURL}/dashboard/playbooks/${workflow.staticId}`);
});
