import { extendType, idArg, nonNull, objectType, stringArg } from 'nexus';
import { UserTypeEnum } from 'prisma-client';

import {
  decodeId,
  getMigrationStatus,
  requireAdmin,
  resolveConnectionFromFindMany,
} from '../../utils';

export const Admin = objectType({
  name: 'Admin',
  definition(t) {
    t.list.field('migrations', {
      type: 'DatabaseMigration',
      resolve: async (_root, {}, { db }) => getMigrationStatus(db),
    });

    t.connectionField('pageSnapshots', {
      type: 'PageSnapshot',
      resolve: resolveConnectionFromFindMany((_root, args, { db }) =>
        db.pageSnapshot.findMany(args)
      ),
    });

    t.connectionField('toolRunLogs', {
      type: 'ToolRunLog',
      resolve: resolveConnectionFromFindMany((_root, args, { db }) =>
        db.toolRunLog.findMany(args)
      ),
    });

    t.connectionField('organizations', {
      type: 'Organization',
      resolve: resolveConnectionFromFindMany((_root, args, { db }) =>
        db.organization.findMany({
          where: { shadowRecord: false },
          ...args,
          orderBy: { name: 'desc' },
        })
      ),
    });

    t.nullable.field('organization', {
      type: 'Organization',
      args: {
        id: idArg(),
        googleDomain: stringArg(),
        name: stringArg(),
      },
      resolve(_root, { id, googleDomain, name }, ctx) {
        if (!id && !googleDomain && !name) {
          throw new Error('Must provide one of id, googleDomain, or name');
        }

        const where: { id?: number; googleDomain?: string; name?: string } = {};

        if (id) {
          const [, decodedId] = decodeId(id);
          where.id = decodedId;
        }

        if (googleDomain) {
          where.googleDomain = googleDomain;
        }

        if (name) {
          where.name = name;
        }

        return ctx.db.organization.findFirst({ where });
      },
    });

    t.nullable.field('user', {
      type: 'User',
      args: {
        id: nonNull(idArg()),
      },
      resolve(_root, { id }, ctx) {
        const [, decodedId] = decodeId(id);
        return ctx.db.user.findUnique({ where: { id: decodedId } });
      },
    });

    t.connectionField('nonOrgUsers', {
      type: 'User',
      nodes(_root, {}, ctx) {
        return ctx.db.user.findMany({
          where: {
            type: UserTypeEnum.user,
            organization: { shadowRecord: true },
          },
          orderBy: { email: 'asc' },
        });
      },
    });

    t.nullable.connectionField('nonOrgDomains', {
      type: 'Domain',
      resolve: resolveConnectionFromFindMany((_root, args, { db }) =>
        db.domain.findMany({
          ...args,
          where: {
            organizationId: null,
            shadowRecord: false,
          },
        })
      ),
    });

    t.nullable.field('notificationStats', {
      type: 'NotificationStats',
      args: {
        id: nonNull(idArg()),
      },
      resolve(_root, { id }, ctx) {
        return ctx.db.notification.findUnique({ where: { id } });
      },
    });
  },
});

export const admin = extendType({
  type: 'Query',
  definition(t) {
    t.nullable.field('admin', {
      type: 'Admin',
      resolve() {
        requireAdmin();
        return {};
      },
    });
  },
});
