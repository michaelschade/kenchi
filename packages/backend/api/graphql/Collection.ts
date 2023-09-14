import {
  booleanArg,
  extendType,
  idArg,
  inputObjectType,
  list,
  nonNull,
  nullable,
  objectType,
} from 'nexus';
import type { SourceValue } from 'nexus/dist/typegenTypeHelpers';
import { Collection as Fields, CollectionAcl as AclFields } from 'nexus-prisma';
import {
  BranchTypeEnum,
  Collection,
  CollectionAcl,
  Prisma,
  PrismaClient,
  User,
} from 'prisma-client';

import {
  getUnwrappedCollectionPermissions,
  hasCollectionPermission,
  hasOrgPermission,
  loggedInUser,
  loggedInUserAndOrg,
} from '../auth/permissions';
import removedSinceLoader from '../dataloaders/removedSinceLoader';
import { ToolModel, WorkflowModel } from '../models';
import { queueCollectionMutation } from '../queue';
import {
  decodeId,
  encodeId,
  filterNullOrUndefined,
  idResolver,
  resolveConnectionFromFindMany,
  resolveConnectionFromFindManyNullable,
  resolveConnectionWithExtra,
  topUsedTools,
} from '../utils';
import {
  invalidValueError,
  notFoundError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';

type ExtraArgs = {
  includeArchived?: boolean | null | undefined;
  updatedSince?: any;
  knownCollectionIds?: string[] | null | undefined;
};
function extraArgFilters(
  collectionId: number,
  { includeArchived, updatedSince, knownCollectionIds }: ExtraArgs
) {
  const encodedCollectionId = encodeId('coll', collectionId);
  // In order to support incremental syncing + getting added to a new collection,
  // we pass up a list of all collection IDs we saw in the last sync. If there's a
  // new ID in that list, we ignore the filters and send back the full list.
  if (knownCollectionIds && !knownCollectionIds.includes(encodedCollectionId)) {
    updatedSince = undefined;
    includeArchived = undefined;
  }
  return {
    isArchived: includeArchived ? undefined : false,
    createdAt: updatedSince ? { gt: updatedSince as string } : undefined,
  };
}

export const CollectionAclObject = objectType({
  name: 'CollectionAcl',
  definition(t) {
    t.id('id', idResolver('cacl'));
    t.field(AclFields.collection);
    // TODO: maybe convert to BaseUser?
    t.field({
      ...AclFields.user,
      type: nullable('LimitedUser'),
    });
    t.field(AclFields.userGroup);
    t.nonNull.list.nonNull.field('permissions', {
      type: 'CollectionPermissionEnum',
    });
  },
});

export const LimitedCollectionObject = objectType({
  name: 'LimitedCollection',
  sourceType: 'prisma.Collection',
  definition(t) {
    t.implements('Node');

    t.id('id', idResolver('coll'));

    // Since the name of this object is "LimitedCollection" TS can't resolve the
    // type of the resolve method, even though both use the underlying
    // "Collection" sourceType. Just ignore it.
    // @ts-ignore
    t.field(Fields.name);
    // @ts-ignore
    t.field(Fields.icon);

    // @ts-ignore
    t.field(Fields.description);
    // @ts-ignore
    t.field(Fields.organization);
  },
});

export const CollectionObject = objectType({
  name: 'Collection',
  definition(t) {
    t.implements('Node');

    t.id('id', idResolver('coll'));
    t.field(Fields.name);
    t.field(Fields.icon);
    t.field(Fields.description);
    t.field(Fields.organization);
    t.field(Fields.acl);
    t.nonNull.list.nonNull.field('defaultPermissions', {
      type: 'CollectionPermissionEnum',
    });
    t.field(Fields.isArchived);

    // TODO: probably make some kind of enum that supports more types than just private
    t.boolean('isPrivate', {
      resolve: async (collection, {}, ctx) => {
        if (
          collection.organizationId &&
          collection.defaultPermissions.length > 0
        ) {
          return false;
        }
        const acls = await ctx.db.collectionAcl.findMany({
          where: { collectionId: collection.id },
        });
        if (acls.length === 1) {
          const user = loggedInUser(ctx);
          if (user && user.id === acls[0].userId) {
            return true;
          }
        }
        return false;
      },
    });

    // These would make sense as a `totalCount` field on workflows/tools'
    // pageInfo, but we don't have a particularly easy way to extend PageInfo so
    // let's just do this for now.

    t.int('toolCount', {
      resolve: (collection, {}, { db }) => getToolCount(collection, db),
    });

    t.int('workflowCount', {
      resolve: (collection, {}, { db }) => getWorkflowCount(collection, db),
    });

    t.connectionField('tools', {
      type: 'ToolLatest',
      additionalArgs: {
        updatedSince: 'DateTime',
        includeArchived: booleanArg(),
        knownCollectionIds: list(nonNull(idArg())),
      },
      extendConnection(t) {
        t.list.string('removed');
      },
      resolve: resolveConnectionWithExtra(
        resolveConnectionFromFindMany((collection, args, ctx, extraArgs) =>
          ToolModel.findMany(ctx, {
            ...args,
            where: {
              collectionId: collection.id,
              isLatest: true,
              branchType: BranchTypeEnum.published,
              ...extraArgFilters(collection.id, extraArgs),
            },
          })
        ),
        (collection, { updatedSince }) => ({
          removed: () =>
            removedSinceLoader('tools').load([collection.id, updatedSince]),
        })
      ),
    });

    t.connectionField('workflows', {
      type: 'WorkflowLatest',
      additionalArgs: {
        updatedSince: 'DateTime',
        includeArchived: booleanArg(),
        knownCollectionIds: list(nonNull(idArg())),
      },
      extendConnection(t) {
        t.list.string('removed');
      },
      resolve: resolveConnectionWithExtra(
        resolveConnectionFromFindMany((collection, args, ctx, extraArgs) =>
          WorkflowModel.findMany(ctx, {
            ...args,
            where: {
              collectionId: collection.id,
              isLatest: true,
              branchType: BranchTypeEnum.published,
              ...extraArgFilters(collection.id, extraArgs),
            },
          })
        ),
        (collection, { updatedSince }, ctx) => ({
          removed: () =>
            removedSinceLoader('workflows').load([collection.id, updatedSince]),
        })
      ),
    });

    t.nullable.connectionField('toolSuggestions', {
      type: 'ToolLatest',
      resolve: resolveConnectionFromFindManyNullable(
        async (collection, args, ctx) =>
          (await hasCollectionPermission(
            ctx.viewerContext,
            collection.id,
            'review_suggestions'
          ))
            ? ToolModel.findMany(ctx, {
                ...args,
                where: {
                  collectionId: collection.id,
                  isLatest: true,
                  isArchived: false,
                  branchType: BranchTypeEnum.suggestion,
                },
              })
            : null
      ),
    });

    t.nullable.connectionField('workflowSuggestions', {
      type: 'WorkflowLatest',
      resolve: resolveConnectionFromFindManyNullable(
        async (collection, args, ctx) =>
          (await hasCollectionPermission(
            ctx.viewerContext,
            collection.id,
            'review_suggestions'
          ))
            ? WorkflowModel.findMany(ctx, {
                ...args,
                where: {
                  collectionId: collection.id,
                  isLatest: true,
                  isArchived: false,
                  branchType: BranchTypeEnum.suggestion,
                },
              })
            : null
      ),
    });

    t.connectionField('relatedTools', {
      type: 'ToolLatest',
      // TODO: pagination
      async nodes(collection, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return [];
        }
        // Finds tools that are included with Workflows in this Collection, even if not explicitly added to the Collection
        const toolStaticIds = await allCollectionTools(ctx.db, collection.id);
        return ToolModel.findMany(ctx, {
          where: {
            isLatest: true,
            isArchived: false,
            branchType: BranchTypeEnum.published,
            staticId: { in: toolStaticIds.map((tool) => tool.static_id) },
            collection: {
              ...visibleCollectionsQuery(user),
              id: { not: collection.id },
            },
          },
        });
      },
    });

    t.connectionField('topUsedTools', {
      type: 'ToolLatest',
      async nodes(collection, { first, after }, ctx) {
        if (after) {
          throw new Error('Pagination not supported');
        }

        const user = loggedInUser(ctx);
        if (!user) {
          throw new Error('Top used tool request requires user.');
        }

        const toolIDs = await allCollectionTools(ctx.db, collection.id);
        return topUsedTools({
          ctx,
          user,
          limit: first,
          filterToolIds: toolIDs.map((t) => t.static_id),
        });
      },
    });

    t.list.string('unwrappedPermissions', {
      async resolve(collection, {}, ctx) {
        if (!ctx.viewerContext) {
          return [];
        }
        return Array.from(
          await getUnwrappedCollectionPermissions(
            ctx.viewerContext,
            collection.id
          )
        );
      },
    });
  },
});

export const CollectionInput = inputObjectType({
  name: 'CollectionInput',
  definition(t) {
    t.nonNull.string('name');
    t.nullable.string('icon');
    t.nonNull.string('description');
    t.nonNull.list.nonNull.field('acl', {
      type: inputObjectType({
        name: 'CollectionAclInput',
        definition(t) {
          t.nullable.id('userId');
          t.nullable.id('userGroupId');
          t.nonNull.list.nonNull.field('permissions', {
            type: 'CollectionPermissionEnum',
          });
        },
      }),
    });
    t.nullable.list.nonNull.field('defaultPermissions', {
      type: 'CollectionPermissionEnum',
    });
  },
});

export const CollectionOutput = objectType({
  name: 'CollectionOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('collection', { type: 'Collection' });
  },
});

export const CollectionMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createCollection', {
      type: 'CollectionOutput',
      args: {
        collectionData: nonNull('CollectionInput'),
      },
      async resolve(
        _root,
        {
          collectionData: { name, icon, description, acl, defaultPermissions },
        },
        ctx
      ) {
        const { user, organization } = loggedInUserAndOrg(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        // TODO(permissions): because we don't distinguish between private and
        // org collections, there's no way to check admin permissions but allow
        // users to still create private collections. The fix is to distinguish
        // between private and org collections explicitly, which we need a UI
        // change to do. We should get to this *soon*.

        // if (
        //   !hasOrgPermission(user, 'manage_collections', user.organizationId)
        // ) {
        //   return { error: permissionError() };
        // }

        // TODO(permissions): right now we allow anyone to grant permissions to
        // any other user or group if they know the ID. Probably want to be
        // smarter.
        const decodedAcl = acl.map((row) => ({
          userGroupId: row.userGroupId
            ? decodeId(row.userGroupId)[1]
            : undefined,
          userId: row.userId ? decodeId(row.userId)[1] : undefined,
          permissions: row.permissions,
        }));

        // Make sure you can view the newly created collection, if not force
        // you into the ACL.
        if (
          organization.shadowRecord ||
          !defaultPermissions?.includes('admin')
        ) {
          // TODO(permissions): this is kind of jank...we use the existence of a
          // group in the ACL to indicate "is visible to org admins". We should
          // be more explicit, probably by not having an orgId on "private"
          // collections.
          // See https://app.asana.com/0/1167661969173411/1200288134418568
          const isVisibleToOrgAdmin =
            !organization.shadowRecord &&
            user.isOrganizationAdmin &&
            decodedAcl.some((row) => row.userGroupId);
          const hasAdminGroupUserIsIn = decodedAcl.some(
            (row) =>
              ctx.viewerContext?._userGroups.some(
                (group) => row.userGroupId === group.id
              ) && row.permissions.includes('admin')
          );
          if (!isVisibleToOrgAdmin && !hasAdminGroupUserIsIn) {
            let hasUserRow = false;
            decodedAcl.forEach((row) => {
              if (row.userId === user.id) {
                row.permissions = ['admin'];
                hasUserRow = true;
              }
            });
            if (!hasUserRow) {
              decodedAcl.push({
                userGroupId: undefined,
                userId: user.id,
                permissions: ['admin'],
              });
            }
          }
        }

        const collection = await ctx.db.collection.create({
          data: {
            // TODO(permissions): Allow org users to make non-org collections?
            organizationId: !organization.shadowRecord
              ? user.organizationId
              : undefined,
            name,
            description,
            icon,
            // Weird bug where if create gets an empty array if tries to make
            // a object with no args. Should file with Prisma.
            acl: { create: decodedAcl.length === 0 ? undefined : decodedAcl },
            defaultPermissions: defaultPermissions || [],
          },
        });
        if (collection) {
          await queueCollectionMutation(collection.id, 'create');
        }
        return { collection };
      },
    });

    t.field('updateCollection', {
      type: 'CollectionOutput',
      args: {
        id: nonNull(idArg()),
        collectionData: nonNull('CollectionInput'),
      },
      async resolve(
        _root,
        {
          id,
          collectionData: { name, icon, description, acl, defaultPermissions },
        },
        ctx
      ) {
        const load = await loadCollectionForEdit(ctx, id);
        if (load[1]) {
          return { error: load[1] };
        }
        const verifyCollection = load[0];

        type AclCreateRow = {
          userGroupId?: number;
          userId?: number;
          permissions: SourceValue<'CollectionPermissionEnum'>[];
        };

        let existingAclRows;
        let newAclRows: AclCreateRow[] | undefined = undefined;
        if (acl) {
          // TODO: this can def cause some race conditions if someone else does
          // similar modifications, since we're computing our writes based on a
          // past read.

          // TODO(permissions): can you grant permissions to any user or group
          // if you know the ID?
          const decodedAcl = acl.map((row) => ({
            userGroupId: row.userGroupId
              ? decodeId(row.userGroupId)[1]
              : undefined,
            userId: row.userId ? decodeId(row.userId)[1] : undefined,
            permissions: row.permissions,
          }));
          existingAclRows = verifyCollection.acl.map<
            [typeof verifyCollection.acl[0], AclCreateRow | undefined]
          >((oldRow) => [
            oldRow,
            decodedAcl.find(
              (newRow) =>
                (newRow.userGroupId &&
                  newRow.userGroupId === oldRow.userGroupId) ||
                (newRow.userId && newRow.userId === oldRow.userId)
            ),
          ]);
          newAclRows = decodedAcl.filter(
            (newRow) =>
              !verifyCollection.acl.some(
                (oldRow) =>
                  (newRow.userGroupId &&
                    newRow.userGroupId === oldRow.userGroupId) ||
                  (newRow.userId && newRow.userId === oldRow.userId)
              )
          );
        }

        const collection = await ctx.db.collection.update({
          where: {
            id: verifyCollection.id,
          },
          data: {
            name,
            icon,
            description,
            acl: {
              delete: existingAclRows
                ?.filter(([, newRow]) => !newRow)
                .map(([oldRow]) => ({ id: oldRow.id })),
              update: existingAclRows
                ?.filter(([, newRow]) => newRow)
                .map(([oldRow, newRow]) => ({
                  where: { id: oldRow.id },
                  data: { permissions: newRow!.permissions },
                })),
              // Weird bug where if create gets an empty array if tries to make
              // a object with no args. Should file with Prisma.
              create: newAclRows?.length === 0 ? undefined : newAclRows,
            },
            defaultPermissions: defaultPermissions || undefined,
          },
        });
        if (collection) {
          await queueCollectionMutation(collection.id, 'update');
        }
        return { collection };
      },
    });

    t.field('archiveCollection', {
      type: 'CollectionOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const load = await loadCollectionForEdit(ctx, id);
        if (load[1]) {
          return { error: load[1] };
        }
        const verifyCollection = load[0];

        const [toolCount, workflowCount] = await Promise.all([
          getToolCount(verifyCollection, ctx.db),
          getWorkflowCount(verifyCollection, ctx.db),
        ]);
        if (toolCount > 0 || workflowCount > 0) {
          return {
            error: invalidValueError(
              'Cannot delete a collection that still has workflows or automations in it. Please move or archive these first.'
            ),
          };
        }

        const collection = await ctx.db.collection.update({
          where: { id: verifyCollection.id },
          data: { isArchived: true },
        });
        if (collection) {
          await queueCollectionMutation(collection.id, 'delete');
        }
        return { collection };
      },
    });
  },
});

export async function loadCollectionForEdit(
  ctx: NexusContext,
  idStr: string
): Promise<
  | [Collection & { acl: CollectionAcl[] }, null]
  | [null, SourceValue<'KenchiError'>]
> {
  const verifyCollection = await ctx.db.collection.findUnique({
    include: { acl: true },
    where: { id: decodeId(idStr)[1] },
  });
  if (!verifyCollection) {
    return [null, notFoundError()];
  }

  const viewerContext = ctx.viewerContext;

  const canManageOrg =
    viewerContext &&
    verifyCollection.organizationId &&
    hasOrgPermission(
      viewerContext.user,
      'manage_collections',
      verifyCollection.organizationId
    );

  if (!canManageOrg) {
    if (
      !(await hasCollectionPermission(
        viewerContext,
        verifyCollection.id,
        'see_collection'
      ))
    ) {
      return [null, notFoundError()];
    }
    if (
      !(await hasCollectionPermission(
        viewerContext,
        verifyCollection.id,
        'manage_collection_permissions'
      ))
    ) {
      return [null, permissionError()];
    }
  }

  return [verifyCollection, null];
}

export const getToolCount = (collection: Collection, db: PrismaClient) =>
  db.tool.count({
    where: {
      collectionId: collection.id,
      isLatest: true,
      isArchived: false,
      branchType: BranchTypeEnum.published,
    },
  });

export const getWorkflowCount = (collection: Collection, db: PrismaClient) =>
  db.workflow.count({
    where: {
      collectionId: collection.id,
      isLatest: true,
      isArchived: false,
      branchType: BranchTypeEnum.published,
    },
  });

async function allCollectionTools(db: PrismaClient, collectionId: number) {
  return db.$queryRaw<{ static_id: string }[]>`
    SELECT DISTINCT tools.static_id
    from collections
    left join workflows on workflows.collection_id = collections.id and workflows.is_latest and not workflows.is_deleted
    -- get all the WCO for Workflows in this Collection
    left join workflow_contains_object as wco on wco.workflow_static_id = workflows.static_id and wco.object_type = 'tool'
    -- get all the WCO for Workflows embedded in Workflows in this Collection; i.e. nested relationships 1 level deep
    left join workflow_contains_object as embedWco on embedWco.workflow_static_id = wco.object_static_id and wco.object_type = 'workflow-embed' and embedWco.object_type = 'tool'
    left join tools on (tools.static_id = wco.object_static_id or tools.static_id = embedWco.object_static_id or tools.collection_id = collections.id) and tools.is_latest
    where
      collections.id = ${collectionId}
      AND NOT tools.is_deleted
      AND tools.is_latest
      AND tools.branch_type = 'published'
  `;
}

export const visibleCollectionsQuery = (
  user: User
): Prisma.CollectionWhereInput => ({
  isArchived: false,
  OR: [
    // If you're an admin and there's at least one group with
    // permissions (e.g. only-user-shared collections aren't visible
    // to admins).
    user.organizationId && user.isOrganizationAdmin
      ? {
          organizationId: user.organizationId,
          acl: { some: { user: null } },
        }
      : undefined,
    // You belong to the same org as the collection and it has some
    // permission on it
    user.organizationId
      ? {
          organizationId: user.organizationId,
          NOT: { defaultPermissions: { equals: [] } },
        }
      : undefined,
    // You have ACL access
    { acl: { some: { userId: user.id } } },
    // A group you're a member of has some ACL access
    {
      acl: {
        some: {
          userGroup: { members: { some: { userId: user.id } } },
        },
      },
    },
  ].filter(filterNullOrUndefined),
});
