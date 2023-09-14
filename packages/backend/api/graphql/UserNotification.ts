import {
  booleanArg,
  extendType,
  idArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import { UserNotification as Fields } from 'nexus-prisma';

import { loggedInUser } from '../auth/permissions';
import { getVersionedNode } from '../utils';
import { notFoundError, unauthenticatedError } from './KenchiError';

export const UserNotification = objectType({
  name: 'UserNotification',
  definition(t) {
    t.id('id', { resolve: (unotif) => unotif.id });
    t.field(Fields.createdAt);
    t.field(Fields.notification);
    t.field(Fields.dismissedAt);
    t.field(Fields.viewedAt);
  },
});

export const markUserNotifications = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('markUserNotifications', {
      type: objectType({
        name: 'UserNotificationOutput',
        definition(t) {
          t.nullable.field('error', { type: 'KenchiError' });
          t.nullable.list.field('userNotifications', {
            type: 'UserNotification',
          });
        },
      }),
      args: {
        viewed: nonNull(booleanArg()),
        staticId: stringArg(),
        types: list(nonNull('NotificationTypeEnum')),
        userNotificationIds: list(nonNull(idArg())),
      },
      async resolve(
        _root,
        { viewed, staticId, types, userNotificationIds },
        ctx
      ) {
        if (
          (userNotificationIds && (staticId || types)) ||
          (staticId && types)
        ) {
          return {
            error: {
              type: 'validationError',
              code: 'invalidValue',
              message:
                'Can only provide one of staticId, types, or userNotificationIds.',
              param: userNotificationIds ? 'userNotificationIds' : 'staticId',
            },
          };
        }
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        if (!userNotificationIds) {
          userNotificationIds = (
            await ctx.db.userNotification.findMany({
              select: { id: true },
              where: {
                userId: user.id,
                notification: {
                  staticId: staticId ? staticId : undefined,
                  type: types ? { in: types } : undefined,
                },
                dismissedAt: null,
                viewedAt: null,
              },
            })
          ).map((n) => n.id);
        }
        await ctx.db.userNotification.updateMany({
          data: viewed ? { viewedAt: new Date() } : { dismissedAt: new Date() },
          where: {
            id: { in: userNotificationIds },
            userId: user.id,
            dismissedAt: null,
            viewedAt: null,
          },
        });
        const userNotifications = await ctx.db.userNotification.findMany({
          where: {
            id: { in: userNotificationIds },
            userId: user.id,
          },
        });
        return { userNotifications };
      },
    });

    t.field('updateSubscription', {
      type: objectType({
        name: 'UserSubscriptionOutput',
        definition(t) {
          t.nullable.field('error', { type: 'KenchiError' });
          t.nullable.field('versionedNode', { type: 'VersionedNode' });
        },
      }),
      args: {
        staticId: nonNull(stringArg()),
        subscribed: nonNull(booleanArg()),
      },
      async resolve(_root, { staticId, subscribed }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        const node = await getVersionedNode(ctx, staticId);
        if (!node) {
          return { error: notFoundError() };
        }
        await ctx.db.userSubscription.upsert({
          create: {
            userId: user.id,
            staticId,
            subscribed,
          },
          update: {
            subscribed,
          },
          where: {
            userId_staticId: {
              userId: user.id,
              staticId,
            },
          },
        });
        // We don't need to refetch the node because the only changed field,
        // `subscribed`, is computed.
        return { subscribed, versionedNode: node };
      },
    });
  },
});
