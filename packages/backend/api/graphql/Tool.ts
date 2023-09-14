import {
  extendType,
  idArg,
  inputObjectType,
  interfaceType,
  nonNull,
  objectType,
} from 'nexus';
import type { InputDefinitionBlock } from 'nexus/dist/definitions/definitionBlocks';
import { Tool as Fields } from 'nexus-prisma';
import { ObjectTypeEnum, Prisma, Tool } from 'prisma-client';

import { loggedInUser } from '../auth/permissions';
import { ToolModel, WorkflowModel } from '../models';
import { expectJsonArray, expectJsonObject } from '../models/utils';
import { queueToolMutation } from '../queue';
import {
  executeCreate,
  executeDelete,
  executeMerge,
  executeRestore,
  executeUpdate,
} from './utils/versionedNodeModify';
import { versionedNodeDefinition } from './VersionedNode';
import { relatedWorkflowsQuery } from './Workflow';

export const ToolInterface = interfaceType({
  name: 'Tool',
  resolveType: (node) => (node.isLatest ? 'ToolLatest' : 'ToolRevision'),
  definition(t) {
    versionedNodeDefinition(t, {
      revisionType: 'ToolRevision',
      latestType: 'ToolLatest',
      model: ToolModel,
    });

    t.field(Fields.name);
    t.field(Fields.description);
    t.field(Fields.icon);
    t.field(Fields.collection);
    t.field(Fields.component);
    t.field(Fields.keywords);
    t.list.nonNull.field('inputs', {
      type: 'ToolInput',
      resolve: ({ inputs }) => {
        expectJsonArray(inputs);
        return inputs;
      },
    });
    t.field('configuration', {
      type: 'ToolConfiguration',
      resolve: ({ configuration }) => {
        expectJsonObject(configuration);
        return configuration;
      },
    });

    t.connectionField('workflows', {
      type: 'WorkflowLatest',
      // TODO: pagination
      async nodes(tool, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return [];
        }

        const where = await relatedWorkflowsQuery(
          tool.staticId,
          ObjectTypeEnum.tool,
          user,
          ctx
        );
        return WorkflowModel.findMany(ctx, { where });
      },
    });

    t.connectionField('collections', {
      type: 'Collection',
      description: 'Collections where this tool is used',
      // TODO: pagination
      async nodes(tool, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return [];
        }

        const where = await relatedWorkflowsQuery(
          tool.staticId,
          ObjectTypeEnum.tool,
          user,
          ctx
        );
        const data = await ctx.db.workflow.findMany({
          select: { collectionId: true },
          distinct: ['collectionId'],
          where,
        });
        const collectionIds = data.map((d) => d.collectionId);
        if (!collectionIds.includes(tool.collectionId)) {
          collectionIds.push(tool.collectionId);
        }
        return ctx.db.collection.findMany({
          where: { id: { in: collectionIds } },
        });
      },
    });
  },
});

export const ToolLatest = objectType({
  name: 'ToolLatest',
  sourceType: 'prisma.Tool',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('LatestNode');
    t.implements('Tool');
  },
});

export const ToolRevision = objectType({
  name: 'ToolRevision',
  sourceType: 'prisma.Tool',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('Tool');
  },
});

function inputs(
  t: InputDefinitionBlock<'ToolCreateInput' | 'ToolUpdateInput'>,
  required: boolean
) {
  const type = required ? ('nonNull' as const) : ('nullable' as const);
  t[type].string('name');
  t[type].field('branchType', { type: 'BranchTypeEnum' });
  t[type].string('description');
  t[type].string('collectionId');
  t[type].string('component');
  t[type].list.nonNull.field('inputs', { type: 'ToolInput' });
  t[type].field('configuration', { type: 'ToolConfiguration' });
  t[type].list.nonNull.string('keywords');

  // Always optional
  t.nullable.string('icon');
  t.nullable.field('majorChangeDescription', { type: 'SlateNodeArray' });
}

export const ToolCreateInput = inputObjectType({
  name: 'ToolCreateInput',
  definition(t) {
    inputs(t, true);
  },
});

export const ToolUpdateInput = inputObjectType({
  name: 'ToolUpdateInput',
  definition(t) {
    inputs(t, false);
  },
});

export const ToolOutput = objectType({
  name: 'ToolOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('tool', { type: 'ToolLatest' });
  },
});

export const ToolMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createTool', {
      type: 'ToolOutput',
      args: {
        toolData: nonNull('ToolCreateInput'),
      },
      async resolve(_root, { toolData }, ctx) {
        const { error, model } = await executeCreate<
          Prisma.ToolUncheckedCreateInput,
          Tool
        >(
          'publish_tool',
          ToolModel.staticIdPrefix,
          ToolModel.branchIdPrefix,
          toolData,
          ctx.viewerContext,
          ctx.db.tool
        );
        if (model) {
          await queueToolMutation(model.id, 'create');
        }
        return { error, tool: model };
      },
    });

    t.field('updateTool', {
      type: 'ToolOutput',
      args: {
        id: nonNull(idArg()),
        toolData: nonNull('ToolUpdateInput'),
      },
      async resolve(_root, { id, toolData }, ctx) {
        const { error, model } = await executeUpdate<
          Prisma.ToolUncheckedCreateInput,
          Tool
        >(
          'publish_tool',
          ToolModel.branchIdPrefix,
          id,
          toolData,
          ToolModel.preservableFields,
          ctx.viewerContext,
          ctx.db.tool
        );
        if (model) {
          await queueToolMutation(model.id, 'update');
        }
        return { error, tool: model };
      },
    });

    t.field('mergeTool', {
      type: 'ToolOutput',
      args: {
        fromId: nonNull(idArg()),
        toId: idArg(),
        toolData: nonNull('ToolUpdateInput'),
      },
      async resolve(_root, { fromId, toId, toolData }, ctx) {
        const { error, model } = await executeMerge<
          Prisma.ToolUncheckedCreateInput,
          Tool
        >(
          'publish_tool',
          fromId,
          toId,
          toolData,
          ToolModel.preservableFields,
          ctx.viewerContext,
          ctx.db.tool
        );
        if (model) {
          await queueToolMutation(model.id, 'update');
        }
        return { error, tool: model };
      },
    });

    t.field('deleteTool', {
      type: 'ToolOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const { error, model } = await executeDelete<
          Prisma.ToolUncheckedCreateInput,
          Tool
        >(
          'publish_tool',
          id,
          ToolModel.preservableFields,
          ctx.viewerContext,
          ctx.db.tool
        );
        if (model) {
          await queueToolMutation(model.id, 'delete');
        }
        return { error, tool: model };
      },
    });

    t.field('restoreTool', {
      type: 'ToolOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const { error, model } = await executeRestore<
          Prisma.ToolUncheckedCreateInput,
          Tool
        >(
          'publish_tool',
          id,
          ToolModel.preservableFields,
          ctx.viewerContext,
          ctx.db.tool
        );
        return { error, tool: model };
      },
    });
  },
});
