import { difference, map } from 'lodash';
import { BranchTypeEnum } from 'prisma-client';

import { getDB } from '../../db';
import {
  configureIndex,
  reindexAll,
  reindexCollection,
  reindexTool,
  reindexWorkflows,
} from '../../search/indexer';

export async function handleToolReindex(id: number) {
  const db = getDB();
  const revision = await db.tool.findUnique({ where: { id: id } });
  if (!revision || revision.branchType !== BranchTypeEnum.published) {
    return;
  }

  return reindexTool(revision.staticId);
}

export async function handleWorkflowReindex(id: number) {
  const db = getDB();
  const revision = await db.workflow.findUnique({ where: { id: id } });
  if (!revision || revision.branchType !== BranchTypeEnum.published) {
    return;
  }

  const dependentWorkflows = await getDependentWorkflows([revision.staticId]);
  return reindexWorkflows(dependentWorkflows);
}

export async function handleCollectionReindex(id: number) {
  return reindexCollection(id);
}

type ReindexAllParams = Parameters<typeof reindexAll>[0];
async function paginateReindex(
  pageSize: number,
  objectType: keyof ReindexAllParams,
  fn: (query: {
    take: number;
    cursor?: { id: number };
    skip?: 1;
    orderBy: { id: 'asc' };
  }) => Promise<ReindexAllParams[typeof objectType]>
) {
  let results = await fn({ take: pageSize, orderBy: { id: 'asc' } });
  if (!results || results.length === 0) {
    return;
  }

  await reindexAll({ [objectType]: results });

  let cursor: number = results[results.length - 1].id;
  while (results.length >= pageSize) {
    results =
      (await fn({
        take: pageSize,
        // Cursor pagination includes the cursor object in the results so we
        // skip over it as we paginate
        skip: 1,
        cursor: { id: cursor },
        orderBy: { id: 'asc' },
      })) || [];
    if (!results || results.length === 0) {
      return;
    }
    cursor = results[results.length - 1].id;

    await reindexAll({ [objectType]: results });
  }
}

export async function handleReindexAll(pageSize: number = 1000) {
  const db = getDB();
  return Promise.all([
    paginateReindex(pageSize, 'tools', async (query) => {
      return db.tool.findMany({
        ...query,
        where: {
          isLatest: true,
          branchType: BranchTypeEnum.published,
          component: 'GmailAction',
        },
      });
    }),
    paginateReindex(pageSize, 'workflows', async (query) => {
      return db.workflow.findMany({
        ...query,
        where: {
          isLatest: true,
          branchType: BranchTypeEnum.published,
        },
      });
    }),
    paginateReindex(pageSize, 'collections', async (query) => {
      return db.collection.findMany(query);
    }),
  ]);
}

export async function handleConfigureSearchIndex() {
  return configureIndex();
}

async function getDependentWorkflows(
  staticIds: string[],
  visitedWorkflows: string[] = staticIds
): Promise<string[]> {
  const dependentWorkflowStaticIds = map(
    await getDB().workflowContainsObject.findMany({
      select: { workflowStaticId: true },
      where: { objectType: 'workflowEmbed', objectStaticId: { in: staticIds } },
    }),
    'workflowStaticId'
  );

  if (dependentWorkflowStaticIds.length === 0) {
    return visitedWorkflows;
  } else {
    return getDependentWorkflows(
      difference(dependentWorkflowStaticIds, visitedWorkflows),
      visitedWorkflows.concat(dependentWorkflowStaticIds)
    );
  }
}
