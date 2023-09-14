import { DateTime } from 'luxon';
import {
  booleanArg,
  extendType,
  interfaceType,
  nonNull,
  stringArg,
} from 'nexus';
import type { InterfaceDefinitionBlock } from 'nexus/dist/definitions/interfaceType';
import { BranchTypeEnum, Space, Tool, Widget, Workflow } from 'prisma-client';

import { loggedInUser } from '../auth/permissions';
import { SpaceModel, ToolModel, WidgetModel, WorkflowModel } from '../models';
import { getMetadata } from '../models/versionedNode';
import {
  getVersionedNode,
  idResolver,
  resolveConnectionFromFindMany,
  resolveConnectionFromFindManyWithExtendedEdge,
  resolveMaybeNull,
  validJsDate,
} from '../utils';
import { withOnlyMajor } from './utils/versionedNodeModify';

type PrismaTypes = {
  Space: Space;
  Workflow: Workflow;
  Tool: Tool;
  Widget: Widget;
};

type ModelTypes = {
  Space: typeof SpaceModel;
  Workflow: typeof WorkflowModel;
  Tool: typeof ToolModel;
  Widget: typeof WidgetModel;
};

export function versionedNodeDefinition<T extends keyof PrismaTypes>(
  tArg: InterfaceDefinitionBlock<'VersionedNode'> | InterfaceDefinitionBlock<T>,
  {
    revisionType,
    latestType,
    model,
  }: {
    revisionType?: `${T}Revision`;
    latestType?: `${T}Latest`;
    model?: ModelTypes[T];
  } = {}
) {
  const t = tArg as InterfaceDefinitionBlock<'VersionedNode'>;
  t.id('id', model ? idResolver(model.revisionIdPrefix) : {});
  t.string('staticId');
  t.nullable.string('branchId');
  t.field('branchType', { type: 'BranchTypeEnum' });
  t.boolean('isLatest');
  t.boolean('isArchived');
  t.boolean('isFirst', { resolve: (item) => !item.previousVersionId });
  t.field('createdByUser', {
    type: 'LimitedUser',
    resolve(item, {}, ctx) {
      return ctx.db.user.findUnique({
        rejectOnNotFound: true,
        where: { id: item.createdByUserId },
      });
    },
  });
  t.nullable.field('suggestedByUser', {
    type: 'LimitedUser',
    resolve(item, {}, ctx) {
      if (!item.suggestedByUserId) {
        return null;
      }
      return ctx.db.user.findUnique({
        rejectOnNotFound: true,
        where: { id: item.suggestedByUserId },
      });
    },
  });
  t.field('createdAt', { type: 'DateTime' });

  t.nullable.string('archiveReason', {
    resolve: (obj) => getMetadata(obj).archiveReason || null,
  });

  t.nullable.boolean('subscribed', {
    resolve: async (node, {}, ctx) => {
      const user = loggedInUser(ctx);
      if (!user) {
        return null;
      }

      const res = await ctx.db.userSubscription.count({
        where: {
          staticId: node.staticId,
          userId: user.id,
        },
      });
      return res > 0;
    },
  });

  t.nullable.boolean('hasActiveNotifications', {
    resolve: async (node, {}, ctx) => {
      const user = loggedInUser(ctx);
      if (!user) {
        return null;
      }
      const count = await ctx.db.userNotification.count({
        where: {
          userId: user.id,
          notification: { staticId: node.staticId },
          viewedAt: null,
          dismissedAt: null,
        },
        take: 1,
      });
      return count > 0;
    },
  });

  t.nullable.field('majorChangeDescription', {
    type: 'SlateNodeArray',
    resolve: (obj) => obj.majorChangeDescription,
  });

  t.nullable.field('settings', {
    type: 'UserItemSettings',
    async resolve(item, {}, ctx) {
      const user = loggedInUser(ctx);
      if (!user) {
        return null;
      }
      return ctx.db.userItemSettings.findUnique({
        where: {
          userId_staticId: {
            userId: user.id,
            staticId: item.staticId,
          },
        },
      });
    },
  });

  t.nullable.list.field('shortcuts', {
    type: 'Shortcut',
    async resolve(item, {}, ctx) {
      const user = loggedInUser(ctx);
      if (!user) {
        return null;
      }
      return ctx.db.shortcut.findMany({
        where: {
          staticId: item.staticId,
          OR: [
            { organizationId: user.organizationId, userId: null },
            { organizationId: null, userId: user.id },
          ],
        },
      });
    },
  });

  if (revisionType && latestType && model) {
    t.nullable.field('previousVersion', {
      type: revisionType,
      resolve: (item, {}, ctx) => {
        if (item.previousVersionId) {
          return model.findById(ctx, item.previousVersionId);
        } else {
          return null;
        }
      },
    });

    t.nullable.field('branchedFrom', {
      type: revisionType,
      resolve: (item, {}, ctx) => {
        if (item.branchedFromId) {
          return model.findById(ctx, item.branchedFromId);
        } else {
          return null;
        }
      },
    });

    t.connectionField('branches', {
      type: latestType,
      additionalArgs: {
        createdByMe: booleanArg(),
        branchType: 'BranchTypeEnum',
      },
      resolve: resolveConnectionFromFindMany(
        async (item, args, ctx, { createdByMe, branchType }) => {
          const user = loggedInUser(ctx);
          const userId = user?.id;
          let createdByUserId = undefined;
          if (createdByMe) {
            createdByUserId = userId;
          } else if (createdByMe === false) {
            createdByUserId = { not: userId };
          }
          // TODO: permission checking?
          return model.findMany(ctx, {
            ...args,
            where: {
              staticId: item.staticId,
              branchType: branchType
                ? branchType
                : { not: BranchTypeEnum.published },
              isLatest: true,
              isArchived: false,
              createdByUserId,
            },
            orderBy: { createdAt: 'desc' },
          }) as Promise<PrismaTypes[T][]>;
        }
      ),
    });

    t.nullable.connectionField('branchVersions', {
      type: revisionType,
      additionalArgs: {
        onlyMajor: booleanArg(),
      },
      resolve: resolveMaybeNull(
        (item) => !item.branchId,
        resolveConnectionFromFindMany((item, args, ctx, { onlyMajor }) => {
          if (!item.branchId) {
            return Promise.resolve([]);
          }
          return model.findMany(ctx, {
            ...args,
            where: withOnlyMajor(onlyMajor, {
              branchId: item.branchId,
              branchType: BranchTypeEnum.published,
            }),
            orderBy: { createdAt: 'desc' },
          }) as Promise<PrismaTypes[T][]>;
        })
      ),
    });

    t.connectionField('publishedVersions', {
      type: revisionType,
      additionalArgs: {
        onlyMajor: booleanArg(),
      },
      resolve: resolveConnectionFromFindMany(
        (item, args, ctx, { onlyMajor }) => {
          return model.findMany(ctx, {
            ...args,
            where: withOnlyMajor(onlyMajor, {
              staticId: item.staticId,
              branchType: BranchTypeEnum.published,
            }),
            orderBy: { createdAt: 'desc' },
          }) as Promise<PrismaTypes[T][]>;
        }
      ),
    });
  }
}

export const LatestNode = interfaceType({
  name: 'LatestNode',
  sourceType: 'backingTypes.PrismaVersionedNode',
  resolveType: (node) => {
    if (!node.isLatest) {
      return null;
    }
    if (node.staticId.startsWith('tool_')) {
      return 'ToolLatest';
    } else if (node.staticId.startsWith('wrkf_')) {
      return 'WorkflowLatest';
    } else if (node.staticId.startsWith('spce_')) {
      return 'SpaceLatest';
    } else if (node.staticId.startsWith('wdgt_')) {
      return 'WidgetLatest';
    } else {
      return null;
    }
  },
  definition(t) {
    t.field('lastListFetch', {
      type: 'DateTime',
      description: `A timestamp field only for use by useList that we use to compute when we last did a useList sync.`,
      resolve: (n) => n.createdAt,
    });
    t.connectionField('topUsage', {
      type: 'LimitedUser',
      additionalArgs: {
        startDate: stringArg(),
        endDate: stringArg(),
      },
      extendEdge(edge) {
        edge.int('count', {
          // connectionPlugin doesn't infer edge return type from resolve
          // (probably because it's nested), so Nexus doesn't know that
          // isManager exists. ts-ignore our way to success...

          // @ts-ignore
          resolve: (edge) => edge.count,
        });
      },
      resolve: resolveConnectionFromFindManyWithExtendedEdge(
        async (item, { cursor, ...args }, { db }, { startDate, endDate }) => {
          if (cursor) {
            throw new Error('Does not support cursor-based pagination');
          }

          const start = validJsDate(
            startDate,
            DateTime.now().minus({ days: 30 })
          );
          const end = validJsDate(endDate, DateTime.now());

          // Me being lazy: fetch for both tools and workflows so we don't have to
          // figure out which one of them `item` is. Only one will ever return results.
          const activity = (
            await Promise.all([
              db.userToolRun.groupBy({
                _count: { id: true },
                where: {
                  runAt: { gte: start, lte: end },
                  staticId: item.staticId,
                },
                by: ['userId'],
                orderBy: { _count: { id: 'desc' } },
                ...args,
              }),
              db.userWorkflowView.groupBy({
                _count: { id: true },
                where: {
                  viewedAt: { gte: start, lte: end },
                  staticId: item.staticId,
                },
                by: ['userId'],
                orderBy: { _count: { id: 'desc' } },
                ...args,
              }),
            ])
          ).flat();

          return await Promise.all(
            activity.map(async (action) => ({
              node: await db.user.findUnique({
                rejectOnNotFound: true,
                where: { id: action.userId },
              }),
              count: action._count.id,
            }))
          );
        }
      ),
    });
    versionedNodeDefinition(
      t as unknown as InterfaceDefinitionBlock<'VersionedNode'>
    );
  },
});

export const VersionedNode = interfaceType({
  name: 'VersionedNode',
  sourceType: 'backingTypes.PrismaVersionedNode',
  resolveType: (node) => {
    if (node.staticId.startsWith('tool_')) {
      return node.isLatest ? 'ToolLatest' : 'ToolRevision';
    } else if (node.staticId.startsWith('wrkf_')) {
      return node.isLatest ? 'WorkflowLatest' : 'WorkflowRevision';
    } else if (node.staticId.startsWith('spce_')) {
      return node.isLatest ? 'SpaceLatest' : 'SpaceRevision';
    } else if (node.staticId.startsWith('wdgt_')) {
      return node.isLatest ? 'WidgetLatest' : 'WidgetRevision';
    } else {
      return null;
    }
  },
  definition(t) {
    versionedNodeDefinition(t);
  },
});

export const VersionedNodeQuery = extendType({
  type: 'Query',
  definition(t) {
    // TODO: maybe rename latestNode
    t.nullable.field('versionedNode', {
      type: 'LatestNode',
      args: {
        staticId: nonNull(stringArg()),
      },
      resolve: (_root, { staticId }, ctx) => getVersionedNode(ctx, staticId),
    });
  },
});
