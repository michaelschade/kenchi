import { DateTime } from 'luxon';
import { extendType, idArg } from 'nexus';
import { AuthTypeEnum, UserTypeEnum } from 'prisma-client';
import uid from 'uid-safe';

import { getCookieOptions } from '../../auth/SessionStore';
import {
  decodeId,
  generateStaticId,
  getAdminEmail,
  requireAdmin,
} from '../../utils';

export const SetupLoginAsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.string('setupLoginAs', {
      args: {
        organizationId: idArg(),
        userId: idArg(),
      },
      async resolve(_root, { organizationId, userId }, ctx) {
        requireAdmin();
        const email = getAdminEmail(ctx);

        const kenchiUser = await ctx.db.user.findUnique({ where: { email } });
        if (!kenchiUser) {
          throw new Error('Unauthenticated admin user');
        }

        if (userId && organizationId) {
          throw new Error('Can only provide one of userId and organizationId');
        }

        let userIdForSession;
        if (userId) {
          const [, decodedUserId] = decodeId(userId);
          const user = await ctx.db.user.findUnique({
            select: { organizationId: true },
            where: { id: decodedUserId },
          });
          if (!user) {
            throw new Error('Invalid user');
          }
          userIdForSession = decodedUserId;
        } else if (organizationId) {
          // TODO: this prob doesn't work right now
          const [, decodedOrgId] = decodeId(organizationId);
          const user = await ctx.db.user.findFirst({
            select: { id: true },
            where: {
              organizationId: decodedOrgId,
              type: UserTypeEnum.kenchi,
            },
          });
          if (!user) {
            throw new Error('Missing kenchi user');
          }
          userIdForSession = user.id;
        } else {
          throw new Error('Must provide either userId or organizationId');
        }

        const authSession = await ctx.db.authSession.create({
          data: {
            id: generateStaticId('auth'),
            expiresAt: DateTime.now().plus({ days: 1 }).toJSDate(),
            secret: await uid(24),
            data: {
              // Preserves the cookie settings, otherwise we get errors and/or default to session cookies
              cookie: getCookieOptions(false),
              originalUserId: kenchiUser.id,
            },
            type: AuthTypeEnum.loginAs,
            userId: userIdForSession,
          },
        });

        return authSession.id;
      },
    });
  },
});
