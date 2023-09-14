import {
  booleanArg,
  extendType,
  idArg,
  interfaceType,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import { User as Fields } from 'nexus-prisma';
import {
  BranchTypeEnum,
  Prisma,
  PrismaPromise,
  Tool,
  User,
  UserGroupMember,
  Workflow,
} from 'prisma-client';

import {
  hasOrgPermission,
  loggedInUser,
  loggedInUserAndOrg,
  orgPermissions,
} from '../auth/permissions';
import { ToolModel, WorkflowModel } from '../models';
import { getUserinfoLatest } from '../models/user';
import { canView } from '../models/versionedNode';
import { queueEmail } from '../queue';
import {
  decodeId,
  filterNullOrUndefined,
  idResolver,
  resolveConnectionFromFindMany,
  resolveConnectionFromFindManyStringId,
  topUsedTools,
  topUsedToolStaticIds,
  topViewedWorkflowStaticIds,
} from '../utils';
import { visibleCollectionsQuery } from './Collection';
import {
  invalidValueError,
  notFoundError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';
import { SHARED_WORKFLOW_TAG } from './Organization';

export const BaseUserInterface = interfaceType({
  name: 'BaseUser',
  sourceType: 'prisma.User',
  resolveType: async (user, ctx) => {
    const me = loggedInUser(ctx);
    if (!me) {
      return 'LimitedUser';
    }
    if (me.id === user.id) {
      return 'User';
    }
    if (hasOrgPermission(me, 'manage_users', user.organizationId)) {
      return 'User';
    }
    return 'LimitedUser';
  },
  definition(t) {
    t.id('id', idResolver('user'));
    t.nullable.string('email');
    t.nullable.string('name');
    t.nullable.string('givenName');

    t.nullable.string('familyName', {
      resolve: (user) => getUserinfoLatest(user)?.family_name ?? null,
    });
    t.nullable.string('picture', {
      resolve: (user) => getUserinfoLatest(user)?.picture ?? null,
    });

    t.nullable.field('disabledAt', { type: 'DateTime' });
    t.field('organization', {
      type: 'Organization',
      async resolve(user, {}, ctx) {
        const org = await ctx.db.user
          .findUnique({ where: { id: user.id } })
          .organization();
        if (!org) {
          throw new Error('User with invalid Org');
        }
        return org;
      },
    });
  },
});

export const LimitedUserObject = objectType({
  name: 'LimitedUser',
  sourceType: 'prisma.User',
  definition(t) {
    t.implements('Node');
    t.implements('BaseUser');
  },
});

export const UserObject = objectType({
  name: 'User',
  definition(t) {
    t.implements('Node');
    t.implements('BaseUser');

    t.id('id', idResolver('user'));
    t.field(Fields.name);
    t.field(Fields.givenName);
    t.field(Fields.email);
    t.field(Fields.organization);
    t.field(Fields.wantsEditSuggestionEmails);
    t.field(Fields.disabledAt);

    t.boolean('hasWorkflow', {
      resolve: async (user, {}, { db }) =>
        !!(await db.workflow.findFirst({
          where: {
            createdByUserId: user.id,
            name: { not: 'Getting started with Kenchi' },
            metadata: { not: { initialContent: SHARED_WORKFLOW_TAG } },
          },
        })),
    });
    t.boolean('hasTool', {
      resolve: async (user, {}, { db }) =>
        !!(await db.tool.findFirst({
          where: {
            createdByUserId: user.id,
            name: { not: "Example: Can't find account" },
          },
        })),
    });

    t.nullable.string('potentialGoogleDomain', {
      resolve: (user) => {
        const userinfo = user.userinfoLatest || user.userinfoFirst;
        if (userinfo && typeof userinfo === 'object' && 'hd' in userinfo) {
          return userinfo.hd as string;
        }
        return null;
      },
    });

    t.list.field('groups', {
      type: 'UserGroup',
      resolve: (user, {}, { db }) =>
        db.userGroup.findMany({
          where: { members: { some: { userId: user.id } } },
        }),
    });

    t.list.string('organizationPermissions', {
      resolve: async (user, {}, { db }) => {
        if (user.isOrganizationAdmin) {
          return [...orgPermissions];
        }

        return [];
      },
    });

    t.connectionField('collections', {
      type: 'Collection',
      resolve: resolveConnectionFromFindMany((user, args, { db }) =>
        db.collection.findMany({
          ...args,
          where: visibleCollectionsQuery(user),
        })
      ),
    });

    t.connectionField('domainSettings', {
      type: 'UserDomainSettings',
      resolve: resolveConnectionFromFindMany((user, args, { db }) =>
        db.userDomainSettings.findMany({
          ...args,
          where: { userId: user.id },
        })
      ),
    });

    t.connectionField('draftTools', {
      type: 'ToolLatest',
      resolve: resolveConnectionFromFindMany((user, args, ctx) =>
        ToolModel.findMany(ctx, {
          ...args,
          where: {
            createdByUserId: user.id,
            isLatest: true,
            branchType: BranchTypeEnum.draft,
            isArchived: false,
          },
        })
      ),
    });

    t.connectionField('draftWorkflows', {
      type: 'WorkflowLatest',
      resolve: resolveConnectionFromFindMany((user, args, ctx) =>
        WorkflowModel.findMany(ctx, {
          ...args,
          where: {
            createdByUserId: user.id,
            isLatest: true,
            branchType: BranchTypeEnum.draft,
            isArchived: false,
          },
        })
      ),
    });

    t.connectionField('notifications', {
      type: 'UserNotification',
      additionalArgs: {
        staticId: stringArg(),
        active: booleanArg(),
      },
      resolve: resolveConnectionFromFindManyStringId(
        (user, args, { db }, { staticId, active }) =>
          db.userNotification.findMany({
            ...args,
            where: {
              userId: user.id,
              notification: staticId ? { staticId } : undefined,
              ...(active === true
                ? { OR: [{ viewedAt: null, dismissedAt: null }] }
                : active === false
                ? {
                    OR: [
                      { viewedAt: { not: null } },
                      { dismissedAt: { not: null } },
                    ],
                  }
                : {}),
            },
          })
      ),
    });

    t.list.string('topUsedToolStaticIds', {
      resolve: (user, {}, ctx) =>
        topUsedToolStaticIds({ ctx, user, limit: 100 }),
    });

    t.list.string('topViewedWorkflowStaticIds', {
      resolve: (user, {}, ctx) =>
        topViewedWorkflowStaticIds({ ctx, user, limit: 100 }),
    });

    t.connectionField('topUsedTools', {
      type: 'ToolLatest',
      async nodes(user, { first, after }, ctx) {
        if (after) {
          throw new Error('Pagination not supported');
        }

        return topUsedTools({ ctx, user, limit: first });
      },
    });

    t.connectionField('majorWorkflowChanges', {
      type: 'WorkflowRevision',
      resolve: resolveConnectionFromFindMany(async (user, args, ctx) => {
        const results = await WorkflowModel.findMany(ctx, {
          ...args,
          ...majorChangesQuery(user),
        });
        return filterChanges(ctx, results);
      }),
    });

    t.connectionField('majorToolChanges', {
      type: 'ToolRevision',
      resolve: resolveConnectionFromFindMany(async (user, args, ctx) => {
        const results = await ToolModel.findMany(ctx, {
          ...args,
          ...majorChangesQuery(user),
        });
        return filterChanges(ctx, results);
      }),
    });

    t.list.field('shortcuts', {
      type: 'Shortcut',
      resolve: (user, {}, { db }) =>
        db.shortcut.findMany({
          where: { organizationId: null, userId: user.id },
        }),
    });

    t.connectionField('spaces', {
      type: 'SpaceLatest',
      nodes: async (user, {}, ctx) => {
        const acl = await ctx.db.spaceAcl.findMany({
          where: {
            OR: [
              { userId: user.id },
              { userGroup: { members: { some: { userId: user.id } } } },
            ],
          },
        });
        const staticIds = acl.map((row) => row.staticId);
        return ctx.db.space.findMany({
          where: {
            OR: [
              { organizationId: user.organizationId, visibleToOrg: true },
              { staticId: { in: staticIds } },
            ].filter(filterNullOrUndefined),
            isArchived: false,
            isLatest: true,
            branchType: BranchTypeEnum.published,
          },
        });
      },
    });

    t.connectionField('magicItemSettings', {
      type: 'UserItemSettings',
      nodes: async (user, {}, ctx) => {
        return ctx.db.userItemSettings.findMany({
          where: {
            userId: user.id,
            staticId: { startsWith: '__' },
          },
        });
      },
    });
  },
});

// This is wrong! We should base your permissions on the *latest* collection for
// an object. For example, if I accidentally move workflow Fire Everyone from
// Exec to Public, and then move it back, its old version should no longer be
// Public. However, the Postgres query to join against latest collectionId would
// be horrendous. Instead, we fetch the one at the time of change and filter
// them out in Node (see filterChanges) even though that can cause inconsistent
// pagination since we'll filter things out post-DB.
const majorChangesQuery = (user: User) => ({
  orderBy: {
    createdAt: 'desc' as const,
  },
  where: {
    collection: visibleCollectionsQuery(user),
    branchType: BranchTypeEnum.published,
    OR: [
      { isArchived: false, majorChangeDescription: { not: { equals: null } } }, // Major change
      { isArchived: true, previousVersion: { isArchived: false } }, // Deleted
      { isArchived: false, previousVersionId: null }, // Newly published from nothing
      {
        isArchived: false,
        previousVersion: { branchType: { not: BranchTypeEnum.published } },
      }, // Newly published from draft
    ],
  },
});

// Do the filtering to fix above comment
const filterChanges = async <T extends Tool | Workflow>(
  ctx: NexusContext,
  results: T[]
): Promise<T[]> => {
  const newResults = await Promise.all(
    results.map(async (obj) => {
      if (await canView(ctx, obj)) {
        return obj;
      } else {
        return null;
      }
    })
  );
  return newResults.filter(filterNullOrUndefined);
};

export const UserOutput = objectType({
  name: 'UserOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('user', { type: 'User' });
  },
});

export const UserMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createUser', {
      type: 'UserOutput',
      args: {
        email: nonNull(stringArg()),
        groupIds: list(nonNull(idArg())),
        isOrganizationAdmin: booleanArg(),
      },
      async resolve(
        _root,
        { email, groupIds, isOrganizationAdmin = false },
        ctx
      ) {
        const { user: me, organization } = loggedInUserAndOrg(ctx);
        if (!organization || organization.shadowRecord) {
          return { error: unauthenticatedError() };
        }

        if (!hasOrgPermission(me, 'manage_users', organization.id)) {
          return { error: permissionError() };
        }

        const userGroupIds = (groupIds || []).map((groupId) => {
          const [, userGroupId] = decodeId(groupId);
          return userGroupId;
        });

        const userGroups = await ctx.db.userGroup.findMany({
          where: {
            id: { in: userGroupIds },
            organizationId: organization.id,
          },
        });
        // TODO: make better errors for any not found groups
        if (userGroups.length !== userGroupIds.length) {
          return { error: notFoundError('groupIds') };
        }

        try {
          const user = await ctx.db.user.create({
            include: { organization: true },
            data: {
              email,
              organizationId: me.organizationId,
              type: 'user',
              groupMemberships: {
                create: userGroupIds.map((userGroupId) => ({ userGroupId })),
              },
              isOrganizationAdmin: isOrganizationAdmin || false,
            },
          });
          await queueEmail(user.id, {
            type: 'newUserInvite',
            data: {
              invitedBy: me.givenName,
              invitedByEmail: me.email,
              orgName: user.organization?.name || null,
            },
          });
          return { user };
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === 'P2002'
          ) {
            const existingUser = await ctx.db.user.findUnique({
              where: { email },
            });
            return {
              error: {
                type: 'validationError',
                code: 'alreadyExists',
                param: 'email',
                message:
                  existingUser?.organizationId === me.organizationId
                    ? `A user with that email address already exists.`
                    : `A user with that email address already exists within Kenchi. If you're trying to add them to this organization, please contact us and we can help.`,
              },
            };
          } else {
            throw e;
          }
        }
      },
    });

    t.field('updateUser', {
      type: 'UserOutput',
      args: {
        id: nonNull(idArg()),
        groupId: idArg(),
        groupIds: list(nonNull(idArg())),
        isOrganizationAdmin: booleanArg(),
      },
      async resolve(
        _root,
        { id, groupId, groupIds, isOrganizationAdmin },
        ctx
      ) {
        // groupId kept for backwards compatibility
        // TODO: move to groupIds
        if (groupId != null) {
          if (groupIds == null) {
            groupIds = [groupId];
          } else {
            return {
              error: invalidValueError(
                'Please provide one of: groupId or groupIds'
              ),
            };
          }
        } else {
          if (groupIds == null) {
            return {
              error: invalidValueError(
                'Please provide one of: groupId or groupIds'
              ),
            };
          }
        }

        const { user: me, organization } = loggedInUserAndOrg(ctx);
        if (!organization || organization.shadowRecord) {
          return { error: unauthenticatedError() };
        }

        if (!hasOrgPermission(me, 'manage_users', organization.id)) {
          return { error: permissionError() };
        }

        const [, userId] = decodeId(id);
        const user = await ctx.db.user.findFirst({
          where: { id: userId, organizationId: organization.id },
        });
        if (!user) {
          return { error: notFoundError() };
        }

        if (user.disabledAt) {
          return { error: invalidValueError('Cannot edit a disabled user') };
        }

        const userGroupIds = groupIds.map((groupId) => {
          const [, userGroupId] = decodeId(groupId);
          return userGroupId;
        });

        const userGroups = await ctx.db.userGroup.findMany({
          where: {
            id: { in: userGroupIds },
            organizationId: organization.id,
          },
        });
        // TODO: make better errors for any not found groups
        if (userGroups.length !== userGroupIds.length) {
          return { error: notFoundError('groupIds') };
        }

        const txns: (
          | PrismaPromise<Prisma.BatchPayload>
          | Prisma.Prisma__UserGroupMemberClient<UserGroupMember>
        )[] = [
          ctx.db.userGroupMember.deleteMany({ where: { userId: user.id } }),
          // The spread below is what we're ignoring with the @ts-ignore below. See:
          // https://github.com/prisma/prisma-client-js/issues/894
          // https://github.com/prisma/prisma/issues/3958
          // TODO: consider moving this to `createMany` once we're on Prisma >= 2.16
          ...userGroupIds.map((userGroupId) =>
            ctx.db.userGroupMember.create({
              data: { userId: user.id, userGroupId },
            })
          ),
        ];

        let newUser;
        if (typeof isOrganizationAdmin === 'boolean') {
          if (me.id === user.id && me.isOrganizationAdmin) {
            return {
              error: invalidValueError(
                "Sorry, we can't let you change your own permission level :) Try asking another admin on your team to update your permissions."
              ),
            };
          }

          const userUpdate = ctx.db.user.update({
            where: { id: user.id },
            data: { isOrganizationAdmin },
          });

          const res = await ctx.db.$transaction([userUpdate, ...txns]);
          newUser = res[0];
        } else {
          await ctx.db.$transaction(txns);
          newUser = user;
        }

        return { user: newUser };
      },
    });

    t.field('disableUser', {
      type: 'UserOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const { user: me, organization } = loggedInUserAndOrg(ctx);
        if (!organization || organization.shadowRecord) {
          return { error: unauthenticatedError() };
        }

        if (!hasOrgPermission(me, 'manage_users', organization.id)) {
          return { error: permissionError() };
        }

        const [, userId] = decodeId(id);
        const user = await ctx.db.user.findFirst({
          where: { id: userId, organizationId: me.organizationId },
        });
        if (!user) {
          return { error: notFoundError() };
        }

        if (me.id === user.id) {
          return {
            error: invalidValueError(
              "Sorry, we can't let you disable your own account :) Try asking another admin on your team to disable your account."
            ),
          };
        }

        const now = new Date();

        const [updatedUser] = await ctx.db.$transaction([
          ctx.db.user.update({
            where: { id: user.id },
            data: { disabledAt: now },
          }),
          ctx.db.authSession.updateMany({
            where: { userId: user.id, expiresAt: { gt: now } },
            data: { expiresAt: now },
          }),
        ]);

        return { user: updatedUser };
      },
    });

    t.field('updateUserSettings', {
      type: 'UserOutput',
      args: {
        wantsEditSuggestionEmails: booleanArg(),
      },
      async resolve(_root, { wantsEditSuggestionEmails }, ctx) {
        const me = loggedInUser(ctx);
        if (!me) {
          return { error: unauthenticatedError() };
        }

        let updatedUser = me;

        // TODO: validate that we have at least one update to perform?
        // TODO: batch updates into a single DB call

        if (typeof wantsEditSuggestionEmails === 'boolean') {
          updatedUser = await ctx.db.user.update({
            where: { id: me.id },
            data: { wantsEditSuggestionEmails },
          });
        }

        return { user: updatedUser };
      },
    });
  },
});
