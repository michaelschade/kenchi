import { captureMessage } from '@sentry/node';
import {
  extendType,
  idArg,
  inputObjectType,
  interfaceType,
  nonNull,
  objectType,
} from 'nexus';
import type { InputDefinitionBlock } from 'nexus/dist/definitions/definitionBlocks';
import { Workflow as Fields } from 'nexus-prisma';
import {
  BranchTypeEnum,
  ObjectTypeEnum,
  Prisma,
  User,
  Workflow,
} from 'prisma-client';

import { loggedInUser } from '../auth/permissions';
import { ToolModel, WorkflowModel } from '../models';
import { queueWorkflowMutation } from '../queue';
import { visibleCollectionsQuery } from './Collection';
import {
  executeCreate,
  executeDelete,
  executeMerge,
  executeRestore,
  executeUpdate,
} from './utils/versionedNodeModify';
import { versionedNodeDefinition } from './VersionedNode';

export const WorkflowInterface = interfaceType({
  name: 'Workflow',
  resolveType: (node) =>
    node.isLatest ? 'WorkflowLatest' : 'WorkflowRevision',
  definition(t) {
    versionedNodeDefinition(t, {
      revisionType: 'WorkflowRevision',
      latestType: 'WorkflowLatest',
      model: WorkflowModel,
    });

    // Workflow-specific
    t.field(Fields.description);
    t.field(Fields.icon);
    t.field(Fields.name);
    t.field(Fields.keywords);

    t.field('contents', { type: 'SlateNodeArray' });

    t.field(Fields.collection);

    // TODO(permissions): permission check
    t.connectionField('linksToWorkflows', {
      type: 'WorkflowLatest',
      // TODO: pagination
      async nodes(workflow, {}, ctx) {
        const objectLinks = await ctx.db.workflowContainsObject.findMany({
          where: {
            workflowStaticId: workflow.staticId,
            objectType: 'workflowLink',
          },
        });
        const staticIds = objectLinks.map((link) => link.objectStaticId);
        return WorkflowModel.findMany(ctx, {
          where: {
            staticId: { in: staticIds },
            branchType: BranchTypeEnum.published,
            isLatest: true,
            isArchived: false,
          },
        });
      },
    });

    // TODO(permissions): permission check
    t.connectionField('linksFromWorkflows', {
      type: 'WorkflowLatest',
      // TODO: pagination
      async nodes(workflow, {}, ctx) {
        const objectLinks = await ctx.db.workflowContainsObject.findMany({
          where: {
            objectStaticId: workflow.staticId,
            objectType: 'workflowLink',
          },
        });
        const staticIds = objectLinks.map((link) => link.workflowStaticId);
        return WorkflowModel.findMany(ctx, {
          where: {
            staticId: { in: staticIds },
            branchType: BranchTypeEnum.published,
            isLatest: true,
            isArchived: false,
          },
        });
      },
    });

    t.connectionField('embedsWorkflows', {
      type: 'WorkflowLatest',
      // TODO: pagination
      async nodes(workflow, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return [];
        }
        const where = await relatedWorkflowsQuery(
          workflow.staticId,
          ObjectTypeEnum.workflowEmbed,
          user,
          ctx,
          true
        );
        return WorkflowModel.findMany(ctx, { where });
      },
    });

    t.connectionField('embeddedInWorkflows', {
      type: 'WorkflowLatest',
      // TODO: pagination
      async nodes(workflow, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return [];
        }
        const where = await relatedWorkflowsQuery(
          workflow.staticId,
          ObjectTypeEnum.workflowEmbed,
          user,
          ctx
        );
        return ctx.db.workflow.findMany({ where });
      },
    });

    t.connectionField('tools', {
      type: 'ToolLatest',
      // TODO: pagination
      async nodes(workflow, {}, ctx) {
        const objectLinks = await ctx.db.workflowContainsObject.findMany({
          where: {
            workflowStaticId: workflow.staticId,
            objectType: 'tool',
          },
        });
        const staticIds = objectLinks.map((link) => link.objectStaticId);
        return ToolModel.findMany(ctx, {
          where: {
            staticId: { in: staticIds },
            isLatest: true,
            isArchived: false,
          },
        });
      },
    });
  },
});

export const WorkflowLatest = objectType({
  name: 'WorkflowLatest',
  sourceType: 'prisma.Workflow',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('LatestNode');
    t.implements('Workflow');
  },
});

export const WorkflowRevision = objectType({
  name: 'WorkflowRevision',
  sourceType: 'prisma.Workflow',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('Workflow');
  },
});

function inputs(
  t: InputDefinitionBlock<'WorkflowCreateInput' | 'WorkflowUpdateInput'>,
  required: boolean
) {
  const type = required ? ('nonNull' as const) : ('nullable' as const);
  t[type].string('name');
  t[type].field('branchType', { type: 'BranchTypeEnum' });
  t[type].string('description');
  t[type].string('collectionId');
  t[type].field('contents', { type: 'SlateNodeArray' });
  t[type].list.nonNull.string('keywords');

  // Always optional
  t.nullable.string('icon');
  t.nullable.field('majorChangeDescription', {
    type: 'SlateNodeArray',
  });
}

export const WorkflowCreateInput = inputObjectType({
  name: 'WorkflowCreateInput',
  definition(t) {
    inputs(t, true);
  },
});

export const WorkflowUpdateInput = inputObjectType({
  name: 'WorkflowUpdateInput',
  definition(t) {
    inputs(t, false);
  },
});

export const WorkflowOutput = objectType({
  name: 'WorkflowOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('workflow', { type: 'WorkflowLatest' });
  },
});

export const WorkflowMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createWorkflow', {
      type: 'WorkflowOutput',
      args: {
        workflowData: nonNull('WorkflowCreateInput'),
      },

      async resolve(_root, { workflowData }, ctx) {
        const { error, model } = await executeCreate<
          Prisma.WorkflowUncheckedCreateInput,
          Workflow
        >(
          'publish_workflow',
          WorkflowModel.staticIdPrefix,
          WorkflowModel.branchIdPrefix,
          workflowData,
          ctx.viewerContext,
          ctx.db.workflow
        );
        if (model) {
          await queueWorkflowMutation(model.id, 'create');
        }
        return { error, workflow: model };
      },
    });

    t.field('updateWorkflow', {
      type: 'WorkflowOutput',
      args: {
        id: nonNull(idArg()),
        workflowData: nonNull('WorkflowUpdateInput'),
      },
      async resolve(_root, { id, workflowData }, ctx) {
        const { error, model } = await executeUpdate<
          Prisma.WorkflowUncheckedCreateInput,
          Workflow
        >(
          'publish_workflow',
          WorkflowModel.branchIdPrefix,
          id,
          workflowData,
          WorkflowModel.preservableFields,
          ctx.viewerContext,
          ctx.db.workflow
        );
        if (model) {
          await queueWorkflowMutation(model.id, 'update');
        }
        return { error, workflow: model };
      },
    });

    t.field('mergeWorkflow', {
      type: 'WorkflowOutput',
      args: {
        fromId: nonNull(idArg()),
        toId: idArg(),
        workflowData: nonNull('WorkflowUpdateInput'),
      },
      async resolve(_root, { fromId, toId, workflowData }, ctx) {
        const { error, model } = await executeMerge<
          Prisma.WorkflowUncheckedCreateInput,
          Workflow
        >(
          'publish_workflow',
          fromId,
          toId,
          workflowData,
          WorkflowModel.preservableFields,
          ctx.viewerContext,
          ctx.db.workflow
        );
        if (model) {
          await queueWorkflowMutation(model.id, 'update');
        }
        return { error, workflow: model };
      },
    });

    t.field('deleteWorkflow', {
      type: 'WorkflowOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const { error, model } = await executeDelete<
          Prisma.WorkflowUncheckedCreateInput,
          Workflow
        >(
          'publish_workflow',
          id,
          WorkflowModel.preservableFields,
          ctx.viewerContext,
          ctx.db.workflow
        );
        if (model) {
          await queueWorkflowMutation(model.id, 'delete');
        }
        return { error, workflow: model };
      },
    });

    t.field('restoreWorkflow', {
      type: 'WorkflowOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const { error, model } = await executeRestore<
          Prisma.WorkflowUncheckedCreateInput,
          Workflow
        >(
          'publish_workflow',
          id,
          WorkflowModel.preservableFields,
          ctx.viewerContext,
          ctx.db.workflow
        );
        return { error, workflow: model };
      },
    });
  },
});

export const relatedWorkflowsQuery = async (
  staticId: string,
  objectType: ObjectTypeEnum,
  user: User,
  ctx: NexusContext,
  reverse?: boolean
) => {
  const [objectLinks, visibleCollections] = await Promise.all([
    ctx.db.workflowContainsObject.findMany({
      where: {
        ...(reverse
          ? { workflowStaticId: staticId }
          : { objectStaticId: staticId }),
        objectType,
      },
    }),
    ctx.db.collection.findMany({
      select: { id: true },
      where: visibleCollectionsQuery(user),
    }),
  ]);
  const staticIds = objectLinks.map((link) =>
    reverse ? link.objectStaticId : link.workflowStaticId
  );
  if (visibleCollections.length > 100) {
    captureMessage(
      'User has 100 collections, time to revisit IN query performance'
    );
  }
  return {
    collectionId: { in: visibleCollections.map((c) => c.id) },
    staticId: { in: staticIds },
    branchType: BranchTypeEnum.published,
    isLatest: true,
    isArchived: false,
  };
};
