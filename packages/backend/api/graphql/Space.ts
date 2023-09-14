import {
  arg,
  extendType,
  idArg,
  inputObjectType,
  interfaceType,
  nonNull,
  nullable,
  objectType,
} from 'nexus';
import { InputDefinitionBlock } from 'nexus/dist/blocks';
import { Space as Fields, SpaceAcl as AclFields } from 'nexus-prisma';
import {
  BranchTypeEnum,
  Prisma,
  PrismaPromise,
  Space,
  User,
} from 'prisma-client';

import { hasOrgPermission, loggedInUserAndOrg } from '../auth/permissions';
import { SpaceModel } from '../models';
import { decodeId, filterNullOrUndefined, idResolver } from '../utils';
import {
  notFoundError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';
import {
  hasSpaceModifyPermission,
  loadForUpdate,
  versionedNodeGeneratedFields,
} from './utils/versionedNodeModify';
import { versionedNodeDefinition } from './VersionedNode';

export const SpaceAcl = objectType({
  name: 'SpaceAcl',
  definition(t) {
    t.id('id', idResolver('sacl'));
    t.field(AclFields.staticId);
    t.field({
      ...AclFields.user,
      type: nullable('LimitedUser'),
    });
    t.field(AclFields.userGroup);
  },
});

export const SpaceInterface = interfaceType({
  name: 'Space',
  resolveType: (node) => (node.isLatest ? 'SpaceLatest' : 'SpaceRevision'),
  definition(t) {
    versionedNodeDefinition(t, {
      revisionType: 'SpaceRevision',
      latestType: 'SpaceLatest',
      model: SpaceModel,
    });

    // Space-specific
    t.field(Fields.name);
    t.field(Fields.widgets);

    t.list.field('acl', {
      type: 'SpaceAcl',
      resolve: (space, {}, { db }) =>
        db.spaceAcl.findMany({ where: { staticId: space.staticId } }),
    });
    t.field(Fields.visibleToOrg);
  },
});

export const SpaceLatest = objectType({
  name: 'SpaceLatest',
  sourceType: 'prisma.Space',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('LatestNode');
    t.implements('Space');
  },
});

export const SpaceRevision = objectType({
  name: 'SpaceRevision',
  sourceType: 'prisma.Space',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('Space');
  },
});

export const SpaceOutput = objectType({
  name: 'SpaceOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('space', { type: 'SpaceLatest' });
  },
});

function inputs(
  t: InputDefinitionBlock<'SpaceCreateInput' | 'SpaceUpdateInput'>,
  required: boolean
) {
  const type = required ? ('nonNull' as const) : ('nullable' as const);

  t[type].string('name');
  t[type].list.nonNull.field('widgets', { type: 'Json' });
  t[type].boolean('visibleToOrg');
  t[type].list.nonNull.id('visibleToGroupIds');
}

export const SpaceCreateInput = inputObjectType({
  name: 'SpaceCreateInput',
  definition(t) {
    inputs(t, true);
  },
});

export const SpaceUpdateInput = inputObjectType({
  name: 'SpaceUpdateInput',
  definition(t) {
    inputs(t, false);
  },
});

const getGroupIds = async (
  ctx: NexusContext,
  user: User,
  encodedGroupIds: string[]
) => {
  const groupIdsWithNulls = await Promise.all(
    encodedGroupIds.map(async (encodedGroupId) => {
      let groupId: number;
      try {
        groupId = decodeId(encodedGroupId)[1];
      } catch (e) {
        return null;
      }
      const group = await ctx.db.userGroup.findUnique({
        where: { id: groupId },
      });
      if (!group || group.organizationId !== user.organizationId) {
        return null;
      }
      return groupId;
    })
  );
  return groupIdsWithNulls.filter(filterNullOrUndefined);
};

export const SpaceMutations = extendType({
  type: 'Mutation',
  definition(t) {
    // TODO: migrate this over to versionedNodeModify.executeCreate
    t.field('createSpace', {
      type: 'SpaceOutput',
      args: {
        spaceData: nonNull(arg({ type: 'SpaceCreateInput' })),
      },
      async resolve(
        _root,
        { spaceData: { name, widgets, visibleToGroupIds, visibleToOrg } },
        ctx
      ) {
        const { user, organization } = loggedInUserAndOrg(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        if (
          // TODO: do we want to restrict this just to org users?
          organization.shadowRecord ||
          !hasOrgPermission(user, 'manage_spaces', user.organizationId)
        ) {
          return { error: permissionError() };
        }

        const groupIds = await getGroupIds(ctx, user, visibleToGroupIds);
        if (groupIds.length < visibleToGroupIds.length) {
          return { error: notFoundError('visibleToGroupIds') };
        }

        const generatedData = versionedNodeGeneratedFields(user, null, 'spce');

        const [model] = await ctx.db.$transaction([
          ctx.db.space.create({
            data: {
              ...generatedData,
              branchType: BranchTypeEnum.published,
              name,
              widgets,
              organizationId: user.organizationId,
              visibleToOrg: visibleToOrg,
            },
          }),
          ctx.db.spaceAcl.createMany({
            data: groupIds.map((userGroupId) => ({
              staticId: generatedData.staticId,
              userGroupId,
            })),
          }),
        ]);

        return { space: model };
      },
    });

    // TODO: migrate this over to versionedNodeModify.executeUpdate
    t.field('updateSpace', {
      type: 'SpaceOutput',
      args: {
        id: nonNull(idArg()),
        spaceData: nonNull(arg({ type: 'SpaceUpdateInput' })),
      },
      async resolve(
        _root,
        { id, spaceData: { name, widgets, visibleToGroupIds, visibleToOrg } },
        ctx
      ) {
        if (!ctx.viewerContext) {
          return { error: unauthenticatedError() };
        }
        const user = ctx.viewerContext.user;

        const idLoad = await loadForUpdate(
          id,
          (model: Space) => hasSpaceModifyPermission(ctx.viewerContext, model),
          ctx.db.space.findUnique
        );
        if (idLoad[0]) {
          return { error: idLoad[0] };
        }
        const [, existingModel] = idLoad;

        if (
          !(await hasSpaceModifyPermission(ctx.viewerContext, existingModel))
        ) {
          return { error: permissionError() };
        }

        let groupIds: number[] | null;
        if (visibleToGroupIds) {
          groupIds = await getGroupIds(ctx, user, visibleToGroupIds);
          if (groupIds.length < visibleToGroupIds.length) {
            return { error: notFoundError('visibleToGroupIds') };
          }
        } else {
          groupIds = null;
        }

        const generatedData = versionedNodeGeneratedFields(user, existingModel);
        const preservableData = SpaceModel.preservableFields(existingModel);

        const data: Prisma.SpaceUncheckedCreateInput = {
          ...generatedData,
          ...preservableData,
          name: name ?? preservableData.name,
          widgets: widgets ?? preservableData.widgets,
          visibleToOrg: visibleToOrg ?? preservableData.visibleToOrg,
        };

        const txns: [PrismaPromise<unknown>, PrismaPromise<Space>] = [
          ctx.db.space.update({
            where: { id: existingModel.id },
            data: { isLatest: false },
          }),
          ctx.db.space.create({ data }),
        ];
        if (groupIds) {
          // Not perfectly transactional but whatever for now
          const existingAcls = await ctx.db.spaceAcl.findMany({
            where: {
              staticId: existingModel.staticId,
              userGroupId: { in: groupIds },
            },
          });
          const existingGroupIds = existingAcls.map((acl) => acl.userGroupId);
          const toCreate = groupIds.filter(
            (id) => !existingGroupIds.includes(id)
          );
          txns.push(
            ctx.db.spaceAcl.deleteMany({
              where: {
                staticId: existingModel.staticId,
                userGroupId: { notIn: groupIds },
              },
            })
          );
          if (toCreate.length > 0) {
            txns.push(
              ctx.db.spaceAcl.createMany({
                data: toCreate.map((userGroupId) => ({
                  staticId: existingModel.staticId,
                  userGroupId,
                })),
              })
            );
          }
        }

        const [, space] = await ctx.db.$transaction(txns);

        return { space };
      },
    });
  },
});
