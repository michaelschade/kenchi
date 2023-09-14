import collectionFactory from '../../src/test/factories/collection';
import spaceFactory from '../../src/test/factories/space';
import toolFactory from '../../src/test/factories/tool';
import userFactory from '../../src/test/factories/user';
import workflowFactory from '../../src/test/factories/workflow';
import test from '../helpers/fixtures';

const tool = toolFactory.build();
const workflow = workflowFactory.build();
const collection = collectionFactory
  .withTools([tool])
  .withWorkflows([workflow])
  .build({ name: 'Just testing' });
const space = spaceFactory.build();
const user = userFactory
  .withCollections([collection])
  .withSpaces([space])
  .build();

// Basic smoke test that launches the extension and confirms playbooks and
// snippets are displayed
test('loading playbooks and snippets within the extension', async ({
  page,
  mockGraphqlServer,
  activateExtension,
}) => {
  mockGraphqlServer.addResolvers({
    Viewer: {
      user: () => user,
      organization: () => null,
    },
  });
  await page.goto(`/empty`);
  await activateExtension();

  const appIframe = page.frameLocator('#kenchi-iframe').frameLocator('iframe');

  await appIframe.locator(`text="${collection.name}"`).hover();

  test
    .expect(await appIframe.locator(`text="${tool.name}"`).isVisible())
    .toBeTruthy();

  test
    .expect(await appIframe.locator(`text="${workflow.name}"`).isVisible())
    .toBeTruthy();
});
