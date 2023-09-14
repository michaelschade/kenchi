import { Factory } from 'fishery';

import { ListCollectionFragment, ListQuery } from '../../graphql/generated';
import connectionHelper from './connectionHelper';
import { PartialTool } from './tool';
import { PartialWorkflow } from './workflow';

export type PartialCollection = ListCollectionFragment &
  NonNullable<
    ListQuery['viewer']['user']
  >['collections']['edges'][number]['node'];
const toolsConnection = (tools: PartialTool[]) => {
  const connections = connectionHelper<PartialCollection['tools']>(
    'CollectionTools_Connection',
    'ToolLatestEdge',
    tools
  );
  return { ...connections, removed: [] };
};

const workflowsConnection = (workflows: PartialWorkflow[]) => {
  const connections = connectionHelper<PartialCollection['workflows']>(
    'CollectionWorkflows_Connection',
    'WorkflowLatestEdge',
    workflows
  );
  return { ...connections, removed: [] };
};

class CollectionFactory extends Factory<PartialCollection> {
  withTools(tools: PartialTool[]) {
    return this.params({
      tools: toolsConnection(tools),
    });
  }

  withWorkflows(workflows: PartialWorkflow[]) {
    return this.params({
      workflows: workflowsConnection(workflows),
    });
  }
}

const collectionFactory = CollectionFactory.define(({ sequence }) => ({
  __typename: 'Collection' as const,
  id: `coll_${sequence}`,
  name: `Collection ${sequence}`,
  icon: '😻',
  description: `This is collection ${sequence}`,
  isPrivate: false,
  tools: toolsConnection([]),
  workflows: workflowsConnection([]),
}));

export default collectionFactory;
