import { arg, extendType, inputObjectType, nonNull, objectType } from 'nexus';
import { UserDomainSettings as Fields } from 'nexus-prisma';

import { loggedInUser } from '../auth/permissions';
import { getDomainInterfaceOptions } from '../models/domain';
import { idResolver } from '../utils';

export const UserDomainSettings = objectType({
  name: 'UserDomainSettings',
  definition(t) {
    t.implements('Node');
    t.id('id', idResolver('uds'));
    t.field(Fields.domain);
    t.field(Fields.open);
    t.nullable.string('side', {
      resolve: (uds) => getDomainInterfaceOptions(uds)?.side ?? null,
    });
    t.nullable.boolean('injectHud', {
      resolve: (uds) => getDomainInterfaceOptions(uds)?.injectHud ?? null,
    });
  },
});

export const SetUserDomainSettingsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nullable.field('setUserDomainSettings', {
      type: objectType({
        name: 'UserDomainSettingsOutput',
        definition(t) {
          t.field('userDomainSettings', { type: 'UserDomainSettings' });
        },
      }),
      args: {
        userDomainSettingsData: nonNull(
          arg({
            type: inputObjectType({
              name: 'UserDomainSettingsInput',
              definition(t) {
                t.nonNull.string('host');
                t.nullable.boolean('open');
                t.nullable.string('side');
              },
            }),
          })
        ),
      },
      async resolve(
        _root,
        { userDomainSettingsData: { host, open, side } },
        ctx
      ) {
        const user = loggedInUser(ctx);
        if (!user) {
          return null;
        }

        const domain = await ctx.db.domain.findFirst({
          where: {
            organizationId: user.organizationId,
            hosts: { has: host },
          },
        });

        const userDomainSettings = await ctx.db.$transaction(async (db) => {
          let uds = null;
          if (domain) {
            uds = await db.userDomainSettings.findUnique({
              where: {
                user_domain_settings_user_id_domain_id_key: {
                  userId: user.id,
                  domainId: domain.id,
                },
              },
            });
          }

          if (uds) {
            const dio = getDomainInterfaceOptions(uds);
            return db.userDomainSettings.update({
              data: {
                open,
                domainInterfaceOptions: {
                  ...dio,
                  side: side ?? dio?.side,
                },
              },
              where: {
                id: uds.id,
              },
            });
          } else {
            return db.userDomainSettings.create({
              data: {
                user: { connect: { id: user.id } },
                domain: domain
                  ? { connect: { id: domain.id } }
                  : {
                      create: {
                        organizationId: user.organizationId,
                        hosts: { set: [host] },
                        shadowRecord: true,
                      },
                    },
                open,
                domainInterfaceOptions: side ? { side } : undefined,
              },
            });
          }
        });

        return { userDomainSettings };
      },
    });
  },
});
