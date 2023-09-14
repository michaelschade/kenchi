import {
  booleanArg,
  extendType,
  idArg,
  inputObjectType,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import type { SourceValue } from 'nexus/dist/typegenTypeHelpers';
import { UserGroup as Fields } from 'nexus-prisma';

import { hasOrgPermission, loggedInUser } from '../auth/permissions';
import {
  decodeId,
  idResolver,
  resolveConnectionFromFindManyWithExtendedEdge,
} from '../utils';
import {
  invalidValueError,
  notFoundError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';

async function handleDuplicateGroup(
  e: any,
  organizationId: number | null,
  name: string,
  ctx: NexusContext
): Promise<{ error: SourceValue<'KenchiError'> }> {
  if (e.code === 'P2002' && organizationId) {
    return {
      error: {
        type: 'validationError',
        code: 'alreadyExists',
        param: 'name',
        message: `A Group with the name '${name}' already exists.`,
      },
    };
  }
  // rethrow
  throw e;
}

export const UserGroupObject = objectType({
  name: 'UserGroup',
  definition(t) {
    t.implements('Node');

    t.id('id', idResolver('ugrp'));
    t.field(Fields.name);
    t.field(Fields.organization);

    t.nullable.boolean('isManager', {
      resolve: async (group, {}, ctx) => {
        const user = loggedInUser(ctx);
        if (!user) {
          return null;
        }
        const member = await ctx.db.userGroupMember.findUnique({
          where: {
            userId_userGroupId: {
              userId: user.id,
              userGroupId: group.id,
            },
          },
        });
        if (!member) {
          return null;
        }
        return member.manager;
      },
    });

    t.connectionField('members', {
      type: 'BaseUser',
      extendEdge(t) {
        t.boolean('isManager', {
          // connectionPlugin doesn't infer edge return type from resolve
          // (probably because it's nested), so Nexus doesn't know that
          // isManager exists. ts-ignore our way to success...

          // @ts-ignore
          resolve: (edge) => edge.isManager,
        });
      },
      resolve: resolveConnectionFromFindManyWithExtendedEdge(
        async (group, { take, cursor, skip }, { db }) => {
          const nodes = await db.userGroupMember.findMany({
            include: { user: true },
            where: { userGroupId: group.id },
            orderBy: { userId: 'asc' },
            cursor: cursor
              ? {
                  userId_userGroupId: {
                    userGroupId: group.id,
                    userId: cursor.id,
                  },
                }
              : undefined,
            take,
            skip,
          });
          return nodes.map((node) => ({
            node: node.user,
            isManager: node.manager, // See extendEdge comment
          }));
        }
      ),
    });
  },
});

export const UserGroupOutput = objectType({
  name: 'UserGroupOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('group', { type: 'UserGroup' });
  },
});

export const GroupMemberInput = inputObjectType({
  name: 'GroupMemberInput',
  definition(t) {
    t.nonNull.id('userId');
    t.nonNull.boolean('isManager');
  },
});

export const UserGroupMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createGroup', {
      type: 'UserGroupOutput',
      args: {
        name: nonNull(stringArg()),
        upsertMembers: list(nonNull('GroupMemberInput')),
      },
      async resolve(_root, { name, upsertMembers }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        if (!hasOrgPermission(user, 'manage_users', user.organizationId)) {
          return { error: permissionError() };
        }

        try {
          const group = await ctx.db.userGroup.create({
            data: {
              organizationId: user.organizationId,
              name,
              members: {
                create: upsertMembers?.map((member) => ({
                  userId: decodeId(member.userId)[1],
                  manager: member.isManager,
                })),
              },
            },
          });
          return { group };
        } catch (e) {
          return await handleDuplicateGroup(e, user.organizationId, name, ctx);
        }
      },
    });

    t.field('updateGroup', {
      type: 'UserGroupOutput',
      args: {
        id: nonNull(idArg()),
        name: nonNull(stringArg()),
        upsertMembers: list(nonNull('GroupMemberInput')),
        removeMembers: list(nonNull(idArg())),
      },
      async resolve(_root, { id, name, upsertMembers, removeMembers }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        const groupWithMember = await ctx.db.userGroup.findUnique({
          include: { members: { where: { userId: user.id } } },
          where: { id: decodeId(id)[1] },
        });
        if (!groupWithMember) {
          return { error: notFoundError() };
        }
        const isInCorrectOrg =
          user.organizationId &&
          groupWithMember.organizationId === user.organizationId;
        // TODO: why do we need this check?
        const membership = groupWithMember.members[0];

        if (!isInCorrectOrg && !membership) {
          return { error: notFoundError() };
        }

        if (
          !(
            isInCorrectOrg &&
            hasOrgPermission(
              user,
              'manage_users',
              groupWithMember.organizationId
            )
          ) &&
          !membership.manager
        ) {
          return { error: permissionError() };
        }

        try {
          const updatedGroup = await ctx.db.userGroup.update({
            where: { id: groupWithMember.id },
            data: {
              name,
              members: {
                upsert: upsertMembers?.map((member) => ({
                  where: {
                    userId_userGroupId: {
                      userId: decodeId(member.userId)[1],
                      userGroupId: groupWithMember.id,
                    },
                  },
                  create: {
                    userId: decodeId(member.userId)[1],
                    manager: member.isManager,
                  },
                  update: {
                    manager: member.isManager,
                  },
                })),
                deleteMany: {
                  userGroupId: groupWithMember.id,
                  userId: {
                    in: removeMembers?.map((userId) => decodeId(userId)[1]),
                  },
                },
              },
            },
          });
          return { group: updatedGroup };
        } catch (e) {
          return await handleDuplicateGroup(e, user.organizationId, name, ctx);
        }
      },
    });

    t.field('updateGroupMember', {
      type: 'UserGroupOutput',
      args: {
        groupId: nonNull(idArg()),
        userId: nonNull(idArg()),
        remove: nonNull(booleanArg()),
        manager: booleanArg(),
      },
      async resolve(_root, { groupId, userId, remove, manager }, ctx) {
        const me = loggedInUser(ctx);
        if (!me) {
          return { error: unauthenticatedError() };
        }

        const groupWithMember = await ctx.db.userGroup.findUnique({
          include: { members: { where: { userId: me.id } } },
          where: { id: decodeId(groupId)[1] },
        });
        if (!groupWithMember) {
          return { error: notFoundError('groupId') };
        }

        const isInCorrectOrg =
          me.organizationId &&
          groupWithMember.organizationId === me.organizationId;

        const membership = groupWithMember.members[0];

        if (!isInCorrectOrg && !membership) {
          return { error: notFoundError() };
        }

        // Needs either org-wide permissions or group manager permission
        if (
          !(
            isInCorrectOrg &&
            hasOrgPermission(me, 'manage_users', groupWithMember.organizationId)
          ) &&
          !membership.manager
        ) {
          return { error: permissionError() };
        }

        const user = await ctx.db.user.findUnique({
          where: { id: decodeId(userId)[1] },
        });
        // TODO(permissions): allow invites from outside group org
        if (!user || user.organizationId !== groupWithMember.organizationId) {
          return { error: notFoundError('userId') };
        }

        if (remove) {
          await ctx.db.userGroupMember.delete({
            where: {
              userId_userGroupId: {
                userGroupId: groupWithMember.id,
                userId: user.id,
              },
            },
          });
        } else {
          if (typeof manager !== 'boolean') {
            return {
              error: invalidValueError(
                'if remove is false manager must be provided',
                'manager'
              ),
            };
          }
          await ctx.db.userGroupMember.upsert({
            where: {
              userId_userGroupId: {
                userGroupId: groupWithMember.id,
                userId: user.id,
              },
            },
            update: {
              manager,
            },
            create: {
              userGroupId: groupWithMember.id,
              userId: user.id,
              manager,
            },
          });
        }

        return { group: groupWithMember };
      },
    });
  },
});
