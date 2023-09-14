import { captureMessage } from '@sentry/node';
import { enumType, objectType } from 'nexus';
import { Notification as Fields } from 'nexus-prisma';
import { BranchTypeEnum, Tool, Workflow } from 'prisma-client';

import { hasCollectionPermission, loggedInUser } from '../auth/permissions';
import { decodeId } from '../utils';
// Old, no longer used notification. May want to clean up at some point.
export const NEW_USER_NOTIF_ID = 'notif_cnewuser';

export const CREATE_ORG_NOTIF_ID = 'notif_ccreateorg';

export const NotificationTypeEnum = enumType({
  name: 'NotificationTypeEnum',
  members: [
    'create_org_prompt',
    'new_user_welcome',
    'product_major_change',
    'tool_created',
    'tool_major_change',
    'tool_archived',
    'workflow_created',
    'workflow_major_change',
    'workflow_archived',
  ],
});

type NotificationData = {
  relatedWorkflowId?: number;
  relatedToolId?: number;
};

export const Notification = objectType({
  name: 'Notification',
  definition(t) {
    t.id('id', { resolve: (notif) => notif.id });
    t.field(Fields.createdAt);
    t.field('type', { type: 'NotificationTypeEnum' });
    t.nullable.field('relatedNode', {
      type: 'Node',
      async resolve(notif, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!notif.data || !user) {
          return null;
        }
        const rawData: NotificationData = notif.data as NotificationData;

        if (!notif.staticId) {
          return null;
        }

        if (notif.type === 'product_major_change') {
          const [, decodedId] = decodeId(notif.staticId);
          const obj = await ctx.db.productChange.findUnique({
            where: { id: decodedId },
          });
          // No perm check
          if (obj) {
            return {
              ...obj,
              __typename: 'ProductChange',
            };
          }
        }

        let obj: Workflow | Tool | null;
        let typename: string;
        if (rawData.relatedWorkflowId) {
          obj = await ctx.db.workflow.findUnique({
            where: { id: rawData.relatedWorkflowId },
          });
          typename = 'WorkflowRevision';
        } else if (rawData.relatedToolId) {
          obj = await ctx.db.tool.findUnique({
            where: { id: rawData.relatedToolId },
          });
          typename = 'ToolRevision';
        } else {
          captureMessage(`Unexpected Notification structure`, {
            extra: { notifId: notif.id },
          });
          return null;
        }

        if (!obj) {
          return null;
        }

        const latestObj =
          (await ctx.db.workflow.findFirst({
            where: {
              staticId: obj.staticId,
              isLatest: true,
              branchType: BranchTypeEnum.published,
            },
          })) || obj;

        if (
          !(await hasCollectionPermission(
            ctx.viewerContext,
            latestObj.collectionId,
            'see_collection'
          ))
        ) {
          return null;
        }

        return {
          ...obj,
          __typename: typename,
        };
      },
    });
  },
});
