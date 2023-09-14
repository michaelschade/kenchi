import { concat, partition } from 'lodash';
import { BranchTypeEnum, Collection, Tool, Workflow } from 'prisma-client';

import { getDB } from '../db';
import { encodeId } from '../utils';
import {
  collectionToSearchObject,
  toolToSearchObject,
  workflowToSearchObject,
} from './convert';
import initSearchClient from './searchClient';

const { index } = initSearchClient(process.env.ALGOLIA_INDEX_APIKEY);

export async function reindexTool(staticId: string) {
  const tool = await getDB().tool.findFirst({
    where: {
      staticId: staticId,
      branchType: BranchTypeEnum.published,
      isLatest: true,
    },
  });

  if (tool) {
    if (tool.isArchived) {
      return deleteItemsFromIndex([tool]);
    } else {
      return addToolsToIndex([tool]);
    }
  }
}

export async function reindexWorkflows(staticIds: string[]) {
  const workflows = await getDB().workflow.findMany({
    where: {
      staticId: { in: staticIds },
      branchType: BranchTypeEnum.published,
      isLatest: true,
    },
  });

  const [workflowDeletions, workflowAdditions] = partition(
    workflows,
    'isArchived'
  );

  return Promise.all([
    addWorkflowsToIndex(workflowAdditions),
    deleteItemsFromIndex(workflowDeletions),
  ]);
}

export async function reindexCollection(id: number) {
  const db = getDB();
  const collection = await db.collection.findUnique({ where: { id: id } });
  if (collection) {
    if (collection.isArchived) {
      return deleteItemsFromIndex([
        { staticId: encodeId('coll', collection.id) },
      ]);
    } else {
      return addCollectionsToIndex([collection]);
    }
  }
}

async function addToolsToIndex(tools: Tool[]) {
  // This could be memory intensive if there are a large number of tools, but
  // the client will automatically batch the API calls
  return index.saveObjects(
    await Promise.all(tools.map((tool) => toolToSearchObject(tool)))
  );
}

async function addWorkflowsToIndex(workflows: Workflow[]) {
  // This could be memory intensive if there are a large number of workflows, but
  // the client will automatically batch the API calls
  return index.saveObjects(
    await Promise.all(
      workflows.map((workflow) => workflowToSearchObject(workflow))
    )
  );
}

async function addCollectionsToIndex(collection: Collection[]) {
  // This could be memory intensive if there are a large number of tools, but
  // the client will automatically batch the API calls
  return index.saveObjects(
    await Promise.all(
      collection.map((collection) => collectionToSearchObject(collection))
    )
  );
}

async function deleteItemsFromIndex(items: { staticId: string }[]) {
  // The client will automatically batch the API calls
  return index.deleteObjects(items.map((item) => item.staticId));
}

export async function reindexAll({
  tools = [],
  workflows = [],
  collections = [],
}: {
  tools?: Tool[];
  workflows?: Workflow[];
  collections?: Collection[];
}) {
  const [toolDeletions, toolAdditions] = partition(tools, 'isArchived');
  const [workflowDeletions, workflowAdditions] = partition(
    workflows,
    'isArchived'
  );
  const [collectionDeletions, collectionAdditions] = partition(
    collections,
    'isArchived'
  );

  return Promise.all([
    addToolsToIndex(toolAdditions),
    addWorkflowsToIndex(workflowAdditions),
    addCollectionsToIndex(collectionAdditions),
    deleteItemsFromIndex(
      concat<{ staticId: string }>(
        toolDeletions,
        workflowDeletions,
        collectionDeletions.map((collection) => ({
          staticId: encodeId('coll', collection.id),
        }))
      )
    ),
  ]);
}

export async function configureIndex() {
  return index.setSettings({
    searchableAttributes: ['keywords', 'name', 'description', 'contents'],
    attributesForFaceting: ['filterOnly(collection.id)', 'filterOnly(type)'],
    unretrievableAttributes: ['metadata.id'],
    separatorsToIndex: '<>+#$£€',
  });
}
