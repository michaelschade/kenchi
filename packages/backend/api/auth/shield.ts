import { allow, or, rule, shield } from 'graphql-shield';
import {
  Collection,
  Notification,
  Organization,
  Shortcut,
  User,
  UserGroup,
} from 'prisma-client';

import { captureGraphQLError } from '../errors';
import { shouldMakeAdminSchema } from '../graphql';
import { isDevelopment, isTesting } from '../utils';
import {
  hasCollectionPermission,
  hasOrgPermission,
  loggedInUser,
} from './permissions';

export default function setupShield() {
  const isLoggedIn = rule({ cache: 'contextual' })(
    async (_parent, _args, ctx: NexusContext) => {
      return !!loggedInUser(ctx);
    }
  );

  // Be careful when using this rule, given cross-org sharing it's often not
  // what you want.
  const matchingOrganization = rule()(
    async (parent, _args, ctx: NexusContext) => {
      const user = loggedInUser(ctx);
      return !!user && user.organizationId === parent.organizationId;
    }
  );

  const matchingOrNullOrganization = or(
    matchingOrganization,
    rule()((parent) => !parent.organizationId)
  );

  const belongsToUser = rule()(
    async ({ userId }: { userId: number }, _args, ctx: NexusContext) => {
      const user = loggedInUser(ctx);
      if (!user) {
        return false;
      }
      if (user.id === userId) {
        return true;
      }
      return false;
    }
  );

  const isAdminEnv = rule({ cache: 'contextual' })(
    () => process.env.ADMIN === 'true'
  );

  const onlyConnectionEdgeOutput = rule({ cache: 'no_cache' })(
    (_parent, _args, _ctx, info) => {
      const objName = info.parentType.name;
      return (
        objName.endsWith('Connection') ||
        objName.endsWith('Edge') ||
        objName.endsWith('Output')
      );
    }
  );

  // TODO(permissions): we rely on the existence of the edge traversal to
  // enforce ability to view a user, as determining if you should be able to
  // view a LimitedUser is very hard (e.g. if I share a workflow with you, you
  // should be able to see limited info about anyone else who has ever edited
  // it). This could allow a malicious user to see LimitedUsers they shouldn't
  // be able to see if we accidentally expose an edge to them.
  //
  // Overall the LimitedUser/User dichotomy is weird and we should revisit at
  // some point, as I expect we'll have various levels of user information we
  // want to expose depending on your relationship with the user.
  const limitedUserHack = allow;

  // HACK: this is so non performant I'm going to strip it out for now...it
  // makes large list fetches stupidly slow.
  // const inheritsVersionedNode = or(versionedNodeOwner, isAdminEnv);
  const inheritsVersionedNode = allow;

  return shield(
    {
      Query: {
        ...(shouldMakeAdminSchema()
          ? {
              admin: isAdminEnv,
              adminNode: isAdminEnv,
            }
          : {}),
        viewer: allow,
        insights: allow,
        insightsRatingDetails: allow,
        node: allow,
        versionedNode: allow,
      },
      Mutation: {
        login: allow,
        loginAs: allow,
        logout: allow,
        // The extension tries to hit this even if you're logged out
        setUserDomainSettings: allow,
        // We're OK taking these from non-users
        sendUserFeedback: allow,
        sendPageSnapshot: allow,
        sendToolRunLog: allow,
        // Everything else is loggedIn but we want to be explicit
        archiveCollection: isLoggedIn,
        archiveDataSource: isLoggedIn,
        archiveExternalDataReference: isLoggedIn,
        archiveExternalTag: isLoggedIn,
        archiveWidget: isLoggedIn,
        createCollection: isLoggedIn,
        createDataImport: isLoggedIn,
        createDataSource: isLoggedIn,
        createExternalDataReference: isLoggedIn,
        createExternalTag: isLoggedIn,
        createGroup: isLoggedIn,
        createOrganization: isLoggedIn,
        createSpace: isLoggedIn,
        createTool: isLoggedIn,
        createUser: isLoggedIn,
        createWidget: isLoggedIn,
        createWorkflow: isLoggedIn,
        deleteTool: isLoggedIn,
        deleteWorkflow: isLoggedIn,
        disableUser: isLoggedIn,
        restoreTool: isLoggedIn,
        restoreWorkflow: isLoggedIn,
        markUserNotifications: isLoggedIn,
        mergeTool: isLoggedIn,
        mergeWorkflow: isLoggedIn,
        setShortcuts: isLoggedIn,
        setUserItemSettings: isLoggedIn,
        updateCollection: isLoggedIn,
        updateDataImport: isLoggedIn,
        updateDataSource: isLoggedIn,
        updateExternalDataReference: isLoggedIn,
        updateExternalTag: isLoggedIn,
        updateGroup: isLoggedIn,
        updateGroupMember: isLoggedIn,
        updateOrganization: isLoggedIn,
        updateSubscription: isLoggedIn,
        updateSpace: isLoggedIn,
        updateTool: isLoggedIn,
        updateUser: isLoggedIn,
        updateUserSettings: isLoggedIn,
        updateWidget: isLoggedIn,
        updateWorkflow: isLoggedIn,
        uploadFile: isLoggedIn,
        // Admin
        ...(shouldMakeAdminSchema()
          ? {
              bulkUpdateTools: isAdminEnv,
              bulkUpdateWorkflows: isAdminEnv,
              notifyProductChange: isAdminEnv,
              requeueUnprocessedLogs: isAdminEnv,
              queueBackfill: isAdminEnv,
              queueConfigureSearchIndex: isAdminEnv,
              queueReindexAll: isAdminEnv,
              setupLoginAs: isAdminEnv,
              updateDemoAccount: isAdminEnv,
              upgradeDB: isAdminEnv,
            }
          : {}),
      },
      AuthSession: belongsToUser,
      BaseUser: limitedUserHack,
      Collection: rule()(
        async (collection: Collection, _args, ctx: NexusContext) => {
          const user = loggedInUser(ctx);
          if (!user) {
            return false;
          }
          // Org users can see the name/members for every collection
          if (user.organizationId === collection.organizationId) {
            return true;
          }
          // Otherwise you need to be explicitly granted some access to the
          // collection
          return hasCollectionPermission(
            ctx.viewerContext,
            collection.id,
            'see_collection'
          );
        }
      ),
      CollectionAcl: rule()(
        async (
          { collectionId }: { collectionId: number },
          _args,
          ctx: NexusContext
        ) => {
          const user = loggedInUser(ctx);
          if (!user) {
            return false;
          }

          if (
            await hasCollectionPermission(
              ctx.viewerContext,
              collectionId,
              'see_collection'
            )
          ) {
            return true;
          }

          const collection = await ctx.db.collection.findUnique({
            where: { id: collectionId },
          });
          if (!collection) {
            return false;
          }

          if (
            user.organizationId &&
            collection.organizationId === user.organizationId
          ) {
            return true;
          }

          return false;
        }
      ),
      DataImport: belongsToUser,
      Domain: or(isAdminEnv, matchingOrNullOrganization),
      DataSource: matchingOrganization,
      ExternalDataReference: matchingOrganization, // TODO(permissions): expand to matchingOrganization or belongsToUser
      ExternalTag: matchingOrganization, // TODO(permissions): decide what to do
      KenchiError: allow,
      LimitedCollection: matchingOrganization,
      LimitedUser: limitedUserHack,
      Node: allow, // Permissions handled for specific Nodes
      Notification: or(
        isAdminEnv,
        rule()(async (notif: Notification, _args, ctx: NexusContext) => {
          const user = loggedInUser(ctx);
          if (!user) {
            return false;
          }
          return !!(await ctx.db.userNotification.findFirst({
            where: { notificationId: notif.id, userId: user.id },
          }));
        })
      ),
      Organization: or(
        isAdminEnv,
        rule()(async (org: Organization, _args, ctx: NexusContext) => {
          const user = loggedInUser(ctx);
          return !!user && user.organizationId === org.id;
        })
      ),
      SearchConfig: allow,
      Shortcut: rule()(async (shortcut: Shortcut, _args, ctx: NexusContext) => {
        const user = loggedInUser(ctx);
        if (!user) {
          return false;
        }
        if (shortcut.userId && shortcut.userId === user.id) {
          return true;
        }
        if (
          shortcut.organizationId &&
          shortcut.organizationId === user.organizationId
        ) {
          return true;
        }
        return false;
      }),
      PageInfo: allow,
      ProductChange: allow,
      SpaceAcl: allow,
      UploadFile: allow, // Mutation result, should rename
      User: or(
        isAdminEnv,
        rule()(async (user: User, _args, ctx: NexusContext) => {
          const me = loggedInUser(ctx);
          if (!me) {
            return false;
          }
          if (user.id === me.id) {
            return true;
          }
          if (user.organizationId) {
            return hasOrgPermission(me, 'manage_users', user.organizationId);
          }
          return false;
        })
      ),
      UserDomainSettings: or(isAdminEnv, belongsToUser),
      UserItemSettings: belongsToUser,
      UserGroup: or(
        matchingOrganization,
        rule({ cache: 'strict' })(
          async (group: UserGroup, _args, ctx: NexusContext) => {
            const user = loggedInUser(ctx);
            if (!user) {
              return false;
            }
            const member = await ctx.db.userGroupMember.findUnique({
              where: {
                userId_userGroupId: {
                  userGroupId: group.id,
                  userId: user.id,
                },
              },
            });
            return !!member;
          }
        )
      ),
      UserNotification: belongsToUser,
      Viewer: allow,

      LatestNode: inheritsVersionedNode,
      VersionedNode: inheritsVersionedNode,

      Space: inheritsVersionedNode,
      SpaceLatest: inheritsVersionedNode,
      SpaceRevision: inheritsVersionedNode,
      Tool: inheritsVersionedNode,
      ToolLatest: inheritsVersionedNode,
      ToolRevision: inheritsVersionedNode,
      Widget: inheritsVersionedNode,
      WidgetLatest: inheritsVersionedNode,
      WidgetRevision: inheritsVersionedNode,
      Workflow: inheritsVersionedNode,
      WorkflowLatest: inheritsVersionedNode,
      WorkflowRevision: inheritsVersionedNode,

      ...(shouldMakeAdminSchema()
        ? {
            Admin: isAdminEnv,
            NotificationStats: isAdminEnv,
            PageSnapshot: isAdminEnv,
            ToolRunLog: isAdminEnv,
            DatabaseMigration: isAdminEnv,
            UnprocessedLog: isAdminEnv,
          }
        : {}),
    },
    {
      allowExternalErrors: isTesting() || isDevelopment(),
      fallbackError: (error, _root, args, ctx, info) => {
        if (error === null) {
          // This is a permission error. Other errors are captured in error.ts
          // middleware.
          const operationName =
            info.operation.name?.value || 'unnamed operation';
          captureGraphQLError(
            `Shield violation in ${operationName}`,
            args,
            ctx as unknown as NexusContext,
            info
          );
          if (isDevelopment()) {
            return new Error(
              'Did you forget to add your object to backend/api/shield.ts?'
            );
          }
        }
        return new Error('unexpectedError');
      },
      fallbackRule: onlyConnectionEdgeOutput,
    }
  );
}
