import { extendType, idArg, nonNull, objectType } from 'nexus';

import { decodeId, generateStaticId, requireAdmin } from '../../utils';

export const NotificationStats = objectType({
  name: 'NotificationStats',
  sourceType: 'prisma.Notification',
  definition(t) {
    t.int('created', {
      resolve: ({ id }, {}, ctx) =>
        ctx.db.userNotification.count({ where: { notificationId: id } }),
    });
    t.int('viewed', {
      resolve: ({ id }, {}, ctx) =>
        ctx.db.userNotification.count({
          where: { notificationId: id, viewedAt: { not: null } },
        }),
    });
    t.int('dismissed', {
      resolve: ({ id }, {}, ctx) =>
        ctx.db.userNotification.count({
          where: { notificationId: id, dismissedAt: { not: null } },
        }),
    });
  },
});

export const NotificationMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('notifyProductChange', {
      type: 'Notification',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        requireAdmin();
        const [, decodedId] = decodeId(id);
        const pc = await ctx.db.productChange.findUnique({
          where: { id: decodedId },
        });
        if (!pc) {
          throw new Error('No PC');
        }
        if (await ctx.db.notification.findFirst({ where: { staticId: id } })) {
          throw new Error('Already exists');
        }
        const allUsers = await ctx.db.user.findMany({ select: { id: true } });
        const notificationId = generateStaticId('notif');
        return ctx.db.notification.create({
          data: {
            id: notificationId,
            type: 'product_major_change',
            staticId: id,
            userNotifications: {
              create: allUsers.map((user) => ({
                id: generateStaticId('unotif'),
                // Right now there's a bug in nested uncheckedScalars, so we have to
                // use `user: {connect: ...}` instead of `userId`. See
                // https://github.com/prisma/prisma/discussions/4410
                user: { connect: { id: user.id } },
              })),
            },
          },
        });
      },
    });
  },
});
