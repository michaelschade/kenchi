import { captureMessage, configureScope } from '@sentry/node';
import { map } from 'lodash';
import { AuthTypeEnum, Organization, User } from 'prisma-client';

import { getDB } from '../db';
import { encodeId } from '../utils';
import { ViewerContext } from './contextType';

// Referenced from the frontend & backend, be careful about removing w.r.t.
// old frontend versions.
export const orgPermissions = [
  'manage_org_shortcuts',
  'manage_users',
  'manage_spaces',
  'manage_collections',
  'manage_org_settings',
  'manage_data_sources',
  'manage_widgets',
] as const;

type OrgPermission = typeof orgPermissions[number];

export function hasOrgPermission(
  user: User,
  _permission: OrgPermission,
  organizationId: number
) {
  if (user.organizationId !== organizationId) {
    captureMessage(
      `User without matching org requesting org admin: denying access`,
      { extra: { userId: user.id } }
    );
    return false;
  }
  if (user.isOrganizationAdmin) {
    return true;
  }

  return false;
}

// Defines what permission groups refer to which permissions/lesser permission groups.
// Make sure you don't accidentally introduce loops here!
const collectionPermissionGroupMap: Record<
  CollectionPermissionGroup,
  (CollectionPermission | CollectionPermissionGroup)[]
> = {
  admin: ['manage_collection_permissions', 'review_suggestions', 'publisher'],
  publisher: ['publish_tool', 'publish_workflow', 'viewer'],
  viewer: ['see_collection'],
};

export const collectionPermissionGroups = [
  'admin',
  'publisher',
  'viewer',
] as const;

const collectionPermissions = [
  'manage_collection_permissions',
  'review_suggestions',
  'publish_tool',
  'publish_workflow',
  'see_collection',
] as const;

export type CollectionPermissionGroup =
  typeof collectionPermissionGroups[number];
export type CollectionPermission = typeof collectionPermissions[number];

const collectionPermissionGroupsSet = new Set(collectionPermissionGroups);
export const isCollectionPermissionGroup = (
  p: string
): p is CollectionPermissionGroup =>
  collectionPermissionGroupsSet.has(p as any);

const collectionPermissionsSet = new Set(collectionPermissions);
const isCollectionPermission = (p: string): p is CollectionPermission =>
  collectionPermissionsSet.has(p as any);

// Have to typecast because we're still building the permissions array: we know by the end it'll be the full record
const unwrappedCollectionPermissionGroups: Record<
  CollectionPermissionGroup,
  CollectionPermission[]
> = {} as Record<CollectionPermissionGroup, CollectionPermission[]>;
const unwrap = (group: CollectionPermissionGroup): CollectionPermission[] =>
  collectionPermissionGroupMap[group].flatMap((p) =>
    isCollectionPermission(p) ? p : unwrap(p)
  );
collectionPermissionGroups.forEach(
  (group) => (unwrappedCollectionPermissionGroups[group] = unwrap(group))
);

function unwrappedCollectionPermissions(
  permissionGroups: string[]
): Set<CollectionPermission> {
  return new Set(
    permissionGroups.flatMap((p) => {
      // Right now we only allow storage of permission groups. We could also
      // support individual permissions if we wanted more granularity.
      if (isCollectionPermissionGroup(p)) {
        return unwrappedCollectionPermissionGroups[p];
      } else {
        captureMessage(`Unexpected permission ${p}`);
        return [];
      }
    })
  );
}

export type CollectionPermissionsDetails = {
  organizationId: number | null;
  allPermissions: Set<CollectionPermission>;
};
export async function computeCollectionPermissionsDetails(
  user: User,
  collectionId: number,
  userGroupIds?: number[] // For caching
): Promise<CollectionPermissionsDetails | null> {
  // TODO: look into combining this with visibleCollectionsQuery, they're
  // conceptually similar
  const collection = await getDB().collection.findUnique({
    include: {
      acl: {
        where: {
          OR: [
            userGroupIds
              ? {
                  userId: null,
                  userGroupId: { in: userGroupIds },
                }
              : {
                  userId: null,
                  userGroup: { members: { some: { userId: user.id } } },
                },
            { userId: user.id, userGroupId: null },
          ],
        },
      },
    },
    where: {
      id: collectionId,
    },
  });

  if (!collection) {
    return null;
  }

  const allPermissions = new Set<CollectionPermission>();
  if (
    user.organizationId &&
    user.organizationId === collection.organizationId
  ) {
    unwrappedCollectionPermissions(collection.defaultPermissions).forEach((p) =>
      allPermissions.add(p)
    );
  }
  collection.acl.forEach(({ permissions }) => {
    unwrappedCollectionPermissions(permissions).forEach((p) =>
      allPermissions.add(p)
    );
  });
  return {
    organizationId: collection.organizationId,
    allPermissions,
  };
}

export async function getUnwrappedCollectionPermissions(
  vc: ViewerContext,
  collectionId: number
): Promise<Set<CollectionPermission>> {
  const user = vc.user;
  if (!user) {
    return new Set();
  }

  if (!vc._collectionPermissionsCache[collectionId]) {
    const details = await computeCollectionPermissionsDetails(
      user,
      collectionId,
      vc._userGroups?.map((ug) => ug.id)
    );
    if (!details) {
      return new Set();
    }

    vc._collectionPermissionsCache[collectionId] = details;
  }

  return vc._collectionPermissionsCache[collectionId].allPermissions;
}

export async function hasCollectionPermission(
  vc: ViewerContext | null,
  collectionId: number,
  permission: CollectionPermission
): Promise<boolean> {
  if (!vc) {
    return false;
  }
  const allPermissions = await getUnwrappedCollectionPermissions(
    vc,
    collectionId
  );
  if (allPermissions.has(permission)) {
    return true;
  }
  const collectionOrgId =
    vc._collectionPermissionsCache[collectionId]?.organizationId;
  if (
    collectionOrgId &&
    hasOrgPermission(vc.user, 'manage_collections', collectionOrgId)
  ) {
    return true;
  }
  return false;
}

export async function userHasCollectionPermission(
  user: User,
  collectionId: number,
  permission: CollectionPermission
): Promise<boolean> {
  const details = await computeCollectionPermissionsDetails(user, collectionId);

  if (!details) {
    return false;
  }

  if (details.allPermissions.has(permission)) {
    return true;
  }

  const collectionOrgId = details.organizationId;
  if (
    collectionOrgId &&
    hasOrgPermission(user, 'manage_collections', collectionOrgId)
  ) {
    return true;
  }
  return false;
}

export async function generateViewerContext(ctx: NexusContext) {
  let user = null;
  if (ctx.session.userId) {
    user = await getDB().user.findUnique({
      include: {
        groupMemberships: { select: { userGroup: true } },
        organization: true,
      },
      where: { id: ctx.session.userId },
    });
    if (!user) {
      ctx.session.destroy(() => {});
    } else if (user.disabledAt) {
      captureMessage(`Found valid session from disabled user`, {
        extra: { userId: user.id },
      });
      ctx.session.destroy(() => {});
      user = null;
    }
  }

  if (user) {
    const sentryUser = {
      id: encodeId('user', user.id),
      email: user.email ?? undefined,
    };
    configureScope((scope) => scope.setUser(sentryUser));

    // We want to resave sessions *only* from valid users and *only* when
    // hitting /graphql so their cookies don't expire, but express-session does
    // not provide this granularity, only their `rolling` global bool (grr).
    // Trick it into resaving via a dirty flag.
    ctx.session.dirty = Math.random();

    ctx.viewerContext = {
      user,
      organization: user.organization,
      authType: ctx.session.authType || AuthTypeEnum.user,
      _collectionPermissionsCache: {},
      _userGroups: map(user.groupMemberships, 'userGroup'),
    };
  } else {
    ctx.viewerContext = null;
  }
}

export function loggedInUser(ctx: NexusContext) {
  return ctx.viewerContext?.user ?? null;
}

export function loggedInUserAndOrg(
  ctx: NexusContext
):
  | { user: User; organization: Organization }
  | { user: null; organization: null } {
  if (ctx.viewerContext) {
    return {
      user: ctx.viewerContext.user,
      organization: ctx.viewerContext.organization,
    };
  }
  return { user: null, organization: null };
}
