import {
  handleCollectionReindex,
  handleToolReindex,
  handleWorkflowReindex,
} from '../../../api/queue/jobs/handleSearchIndexUpdate';
import { processJob } from '../../../api/queue/worker';
import collectionFactory from '../../helpers/factories/collection';
import toolFactory from '../../helpers/factories/tool';
import workflowFactory from '../../helpers/factories/workflow';

jest.mock('../../../api/queue/jobs/handleSearchIndexUpdate');

it('updates the search index on a tool mutation', async () => {
  const mockToolReindex = handleToolReindex as jest.MockedFunction<
    typeof handleToolReindex
  >;
  const tool = await toolFactory.create();
  await processJob({ name: 'toolMutation', toolId: tool.id, action: 'create' });

  expect(mockToolReindex).toHaveBeenCalledWith(tool.id);
});
it('updates the search index on a workflow mutation', async () => {
  const mockWorkflowReindex = handleWorkflowReindex as jest.MockedFunction<
    typeof handleWorkflowReindex
  >;
  const workflow = await workflowFactory.create();
  await processJob({
    name: 'workflowMutation',
    workflowId: workflow.id,
    action: 'create',
  });

  expect(mockWorkflowReindex).toHaveBeenCalledWith(workflow.id);
});
it('updates the search index on a collection mutation', async () => {
  const mockCollectionReindex = handleCollectionReindex as jest.MockedFunction<
    typeof handleCollectionReindex
  >;
  const collection = await collectionFactory.create();
  await processJob({
    name: 'collectionMutation',
    collectionId: collection.id,
    action: 'create',
  });

  expect(mockCollectionReindex).toHaveBeenCalledWith(collection.id);
});
