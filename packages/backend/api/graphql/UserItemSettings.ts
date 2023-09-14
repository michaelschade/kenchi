import { extendType, nonNull, objectType, stringArg } from 'nexus';
import { UserItemSettings as Fields } from 'nexus-prisma';

import { loggedInUser } from '../auth/permissions';
import { invalidValueError, unauthenticatedError } from './KenchiError';

export const UserItemSettings = objectType({
  name: 'UserItemSettings',
  definition(t) {
    t.field(Fields.staticId);
    t.field(Fields.data);
  },
});

export const SetUserItemSettingsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nullable.field('setUserItemSettings', {
      type: objectType({
        name: 'UserItemSettingsOutput',
        definition(t) {
          t.nullable.field('error', { type: 'KenchiError' });
          t.nullable.field('userItemSettings', { type: 'UserItemSettings' });
        },
      }),
      args: {
        staticId: nonNull(stringArg()),
        data: nonNull('Json'),
      },
      async resolve(_root, { staticId, data }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        if (typeof data !== 'object') {
          return { error: invalidValueError('Invalid data format', 'data') };
        }

        const userItemSettings = await ctx.db.userItemSettings.upsert({
          where: {
            userId_staticId: {
              userId: user.id,
              staticId,
            },
          },
          update: {
            data,
          },
          create: {
            userId: user.id,
            staticId,
            data,
          },
        });

        return { userItemSettings };
      },
    });
  },
});
