import { extendType, nonNull, nullable, objectType, stringArg } from 'nexus';
import { Shortcut as Fields } from 'nexus-prisma';
import { Prisma } from 'prisma-client';

import {
  hasOrgPermission,
  loggedInUser,
  loggedInUserAndOrg,
} from '../auth/permissions';
import { getVersionedNode, idResolver } from '../utils';
import {
  invalidValueError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';

export const Shortcut = objectType({
  name: 'Shortcut',
  definition(t) {
    // Ugh, have an ID just for caching. Lame.
    t.id('id', idResolver('shrt'));
    t.field(Fields.organization);
    t.field({
      ...Fields.user,
      type: nullable('LimitedUser'),
    });
    t.field(Fields.staticId);
    t.boolean('orgWide', { resolve: (s) => !s.userId });
    t.nullable.field('latestNode', {
      type: 'LatestNode',
      async resolve({ staticId }, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return null;
        }
        return getVersionedNode(ctx, staticId);
      },
    });
    t.field(Fields.shortcut);
  },
});

export const SetShortcutMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('setShortcuts', {
      type: objectType({
        name: 'SetShortcutsOutput',
        definition(t) {
          t.nullable.field('error', { type: 'KenchiError' });
          t.nullable.field('orgShortcut', { type: 'Shortcut' });
          t.nullable.field('userShortcut', { type: 'Shortcut' });
        },
      }),
      args: {
        staticId: nonNull(stringArg()),
        orgShortcut: stringArg(),
        userShortcut: stringArg(),
      },
      async resolve(_root, { staticId, userShortcut, orgShortcut }, ctx) {
        orgShortcut = orgShortcut?.toLowerCase();
        userShortcut = userShortcut?.toLowerCase();

        if (orgShortcut === undefined && userShortcut === undefined) {
          return {
            error: invalidValueError(
              'Must set at least one of: orgShortcut, userShortcut'
            ),
          };
        }

        const { user, organization } = loggedInUserAndOrg(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        if (orgShortcut !== undefined) {
          if (organization.shadowRecord) {
            return {
              error: invalidValueError(
                'User not in organization',
                'orgShortcut'
              ),
            };
          }
          if (
            !hasOrgPermission(user, 'manage_org_shortcuts', organization.id)
          ) {
            return { error: permissionError() };
          }
        }

        // Uses a partial unique index so requires a manual SQL upsert
        const transactions = [];
        if (orgShortcut !== undefined) {
          transactions.push(
            ctx.db.$executeRaw`
              INSERT INTO shortcuts (organization_id, static_id, shortcut)
              VALUES (${user.organizationId}, ${staticId}, ${orgShortcut})
              ON CONFLICT (organization_id, static_id) WHERE user_id IS NULL
              DO UPDATE SET shortcut = ${orgShortcut}
            `
          );
        }
        if (userShortcut !== undefined) {
          transactions.push(
            ctx.db.$executeRaw`
              INSERT INTO shortcuts (user_id, static_id, shortcut)
              VALUES (${user.id}, ${staticId}, ${userShortcut})
              ON CONFLICT (user_id, static_id) WHERE organization_id IS NULL
              DO UPDATE SET shortcut = ${userShortcut}
            `
          );
        }

        try {
          await ctx.db.$transaction(transactions);
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            (e.code === 'P2002' || e.code === 'P2010')
          ) {
            // P2010 is raw query failed
            const conflictingShortcut = await ctx.db.shortcut.findFirst({
              where: {
                OR: [
                  {
                    organizationId: user.organizationId,
                    userId: null,
                    shortcut: orgShortcut,
                  },
                  {
                    organizationId: null,
                    userId: user.id,
                    shortcut: userShortcut,
                  },
                ],
              },
            });
            if (!conflictingShortcut) {
              throw e;
            }

            return {
              error: {
                type: 'validationError',
                code: 'alreadyExists',
                param:
                  orgShortcut !== undefined &&
                  conflictingShortcut.organizationId
                    ? 'orgShortcut'
                    : 'userShortcut',
                message:
                  orgShortcut !== undefined &&
                  conflictingShortcut.organizationId
                    ? 'That organization shortcut is already set, please remove it first.'
                    : 'That user shortcut is already set, please remove it first.',
              },
            };
          } else {
            throw e;
          }
        }

        const [orgShortcutData, userShortcutData] = await Promise.all([
          ctx.db.shortcut.findFirst({
            where: {
              organizationId: user.organizationId,
              userId: null,
              staticId,
            },
          }),
          ctx.db.shortcut.findFirst({
            where: {
              organizationId: null,
              userId: user.id,
              staticId,
            },
          }),
        ]);

        return {
          orgShortcut: orgShortcutData,
          userShortcut: userShortcutData,
        };
      },
    });
  },
});
