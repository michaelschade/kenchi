import { BranchTypeEnum, PrismaPromise, User } from 'prisma-client';

import {
  CollectionPermission,
  userHasCollectionPermission,
} from '../../auth/permissions';
import getConfig from '../../config';
import { getDB } from '../../db';
import { filterNullOrUndefined, generateStaticId } from '../../utils';
import { CRUDAction, queueEmail } from '../';

const db = getDB();

type ExtractedObject = {
  staticId: string;
  type: 'tool' | 'workflowEmbed' | 'workflowLink';
};

// Recursively extract all tool and embed IDs
const extractObjects = (contents: any): ExtractedObject[] => {
  let objects: ExtractedObject[] = [];
  for (const node of contents) {
    if (node.type === 'tool') {
      objects.push({ staticId: node.tool, type: node.type });
    } else if (node.type === 'workflow-embed') {
      objects.push({ staticId: node.workflow, type: 'workflowEmbed' });
    } else if (node.type === 'workflow-link') {
      objects.push({ staticId: node.workflow, type: 'workflowLink' });
    }
    if (node.children?.length > 0) {
      objects = objects.concat(extractObjects(node.children));
    }
  }
  return objects.flat();
};

export async function handleToolMutation(id: number, action: CRUDAction) {
  const rev = await db.tool.findUnique({
    where: { id },
    include: { previousVersion: true, collection: true, suggestedByUser: true },
  });
  if (!rev) {
    throw new Error(
      'Tried to process toolMutation, but could not find tool by ID'
    );
  }

  await handleToolNotification(id, action);

  if (
    isSuggestionRevision(rev) &&
    (await shouldTriggerSuggestionEmail(rev, db.tool.findFirst))
  ) {
    const users = await db.user.findMany({
      where: {
        organizationId: rev.collection.organizationId,
        wantsEditSuggestionEmails: true,
        id: { not: rev.suggestedByUser?.id },
      },
    });

    const publishers = await filterUsersByCollectionPermission(
      users,
      rev.collection.id,
      'review_suggestions'
    );

    if (publishers.length) {
      await Promise.all(
        publishers.map((user) =>
          queueEmail(user.id, {
            type: 'newSuggestion',
            data: {
              suggestionName: rev.previousVersion?.name || rev.name,
              suggestionLink: `${getConfig().appHost}/dashboard/suggestions/${
                rev.branchId
              }`,
              suggestedBy: rev.suggestedByUser?.givenName ?? null,
              itemType: 'automation',
              isNewItem: !rev.branchedFromId,
            },
          })
        )
      );
    }
  }
}

export async function handleWorkflowMutation(id: number, action: CRUDAction) {
  const rev = await db.workflow.findUnique({
    where: { id },
    include: { previousVersion: true, collection: true, suggestedByUser: true },
  });
  if (!rev) {
    throw new Error(
      'Tried to process workflowMutation queue worker, but could not find workflow by ID'
    );
  }

  // send email when someone makes a suggestion (!suggestion -> suggestion)
  // maybe send email when someone updates suggestion (suggestion -> suggestion)
  // send email when suggestion is accepted/denied (suggestion archived)

  // fingers crossed
  await Promise.all([
    handleWorkflowContainsObject(id, action),
    handleWorkflowNotification(id, action),
  ]);

  if (
    isSuggestionRevision(rev) &&
    (await shouldTriggerSuggestionEmail(rev, db.workflow.findFirst))
  ) {
    const users = await db.user.findMany({
      where: {
        organizationId: rev.collection.organizationId,
        wantsEditSuggestionEmails: true,
        id: { not: rev.suggestedByUser?.id },
      },
    });

    const publishers = await filterUsersByCollectionPermission(
      users,
      rev.collection.id,
      'review_suggestions'
    );

    if (publishers.length) {
      await Promise.all(
        publishers.map((user) =>
          queueEmail(user.id, {
            type: 'newSuggestion',
            data: {
              suggestionName: rev.previousVersion?.name || rev.name,
              suggestionLink: `${getConfig().appHost}/dashboard/suggestions/${
                rev.branchId
              }`,
              suggestedBy: rev.suggestedByUser?.givenName ?? null,
              itemType: 'workflow',
              isNewItem: !rev.branchedFromId,
            },
          })
        )
      );
    }
  }
}

async function handleWorkflowContainsObject(id: number, action: CRUDAction) {
  const rev = await db.workflow.findUnique({ where: { id } });
  if (!rev) {
    throw new Error(
      'Tried to process WorkflowContainsObject queue worker, but could not find workflow by ID'
    );
  }

  if (rev.branchType !== BranchTypeEnum.published) {
    return;
  }

  // Run this on isLatest in case we process these out of order
  const workflow = await db.workflow.findFirst({
    where: {
      staticId: rev.staticId,
      branchType: BranchTypeEnum.published,
      isLatest: true,
    },
    rejectOnNotFound: true,
  });

  const dbOps: PrismaPromise<any>[] = [];
  dbOps.push(
    db.workflowContainsObject.deleteMany({
      where: { workflowStaticId: workflow.staticId },
    })
  );

  if (action === 'create' || action === 'update') {
    const objects = extractObjects(workflow.contents);
    const processed: ExtractedObject[] = [];
    for (const object of objects) {
      if (
        processed.find(
          (p) => p.type === object.type && p.staticId === object.staticId
        )
      ) {
        continue;
      }
      dbOps.push(
        db.workflowContainsObject.create({
          data: {
            workflowStaticId: workflow.staticId,
            objectStaticId: object.staticId,
            objectType: object.type,
          },
        })
      );
      processed.push(object);
    }
  }

  await db.$transaction(dbOps);
}

async function handleToolNotification(id: number, _action: CRUDAction) {
  const rev = await db.tool.findUnique({
    include: { collection: true, previousVersion: true },
    where: { id },
  });
  if (!rev) {
    throw new Error(
      'Tried to process toolNotification queue worker, but could not find tool by ID'
    );
  }

  if (rev.branchType !== BranchTypeEnum.published) {
    return;
  }

  let type: string;
  if (
    rev.isArchived &&
    rev.previousVersion &&
    !rev.previousVersion.isArchived
  ) {
    type = 'tool_archived';
  } else if (
    !rev.previousVersion ||
    rev.previousVersion.branchType !== 'published'
  ) {
    type = 'tool_created';
  } else if (rev.majorChangeDescription) {
    type = 'tool_major_change';
  } else {
    return;
  }

  const subscriptions = await db.userSubscription.findMany({
    where: { staticId: rev.staticId },
  });

  await db.notification.create({
    data: {
      id: generateStaticId('notif'),
      type,
      data: { relatedToolId: rev.id },
      staticId: rev.staticId,
      userNotifications: {
        create: subscriptions.map((sub) => ({
          id: generateStaticId('unotif'),
          // Right now there's a bug in nested uncheckedScalars, so we have to
          // use `user: {connect: ...}` instead of `userId`. See
          // https://github.com/prisma/prisma/discussions/4410
          user: { connect: { id: sub.userId } },
        })),
      },
    },
  });
}

async function handleWorkflowNotification(id: number, _action: CRUDAction) {
  const rev = await db.workflow.findUnique({
    include: { collection: true, previousVersion: true },
    where: { id },
  });
  if (!rev) {
    throw new Error(
      'Tried to process WorkflowContainsObject queue worker, but could not find workflow by ID'
    );
  }

  if (rev.branchType !== BranchTypeEnum.published) {
    return;
  }

  let type: string;
  if (
    rev.isArchived &&
    rev.previousVersion &&
    !rev.previousVersion.isArchived
  ) {
    type = 'workflow_archived';
  } else if (
    !rev.previousVersion ||
    rev.previousVersion.branchType !== 'published'
  ) {
    type = 'workflow_created';
  } else if (rev.majorChangeDescription) {
    type = 'workflow_major_change';
  } else {
    return;
  }

  const subscriptions = await db.userSubscription.findMany({
    where: { staticId: rev.staticId },
  });

  await db.notification.create({
    data: {
      id: generateStaticId('notif'),
      type,
      data: { relatedWorkflowId: rev.id },
      staticId: rev.staticId,
      userNotifications: {
        create: subscriptions.map((sub) => ({
          id: generateStaticId('unotif'),
          // Right now there's a bug in nested uncheckedScalars, so we have to
          // use `user: {connect: ...}` instead of `userId`. See
          // https://github.com/prisma/prisma/discussions/4410
          user: { connect: { id: sub.userId } },
        })),
      },
    },
  });
}

async function filterUsersByCollectionPermission(
  users: User[],
  collectionId: number,
  permission: CollectionPermission
) {
  const publishersAndNull = await Promise.all(
    users.map(async (user) => {
      const hasPermission = await userHasCollectionPermission(
        user,
        collectionId,
        permission
      );
      return hasPermission ? user : null;
    })
  );
  return publishersAndNull.filter(filterNullOrUndefined);
}

type RevisionDetails = {
  staticId: string;
  branchId: string | null;
  branchType: BranchTypeEnum;
  previousVersion: { branchType: BranchTypeEnum } | null;
  collection: { organizationId: number | null };
};
type SuggestionRevisionDetails = {
  staticId: string;
  branchId: string;
  branchType: Extract<BranchTypeEnum, 'suggestion'>;
  previousVersion: {
    branchType: Exclude<BranchTypeEnum, 'suggestion'>;
  } | null;
  collection: { organizationId: number };
};
function isSuggestionRevision(
  obj: RevisionDetails
): obj is SuggestionRevisionDetails {
  return !!(
    obj.branchId &&
    obj.branchType === BranchTypeEnum.suggestion &&
    obj.previousVersion?.branchType !== BranchTypeEnum.suggestion &&
    obj.collection.organizationId
  );
}

async function shouldTriggerSuggestionEmail(
  obj: SuggestionRevisionDetails,
  findFirst: (args: {
    where: { staticId: string; branchId: string; isLatest: boolean };
  }) => Promise<{ isArchived: boolean } | null>
) {
  const latest = await findFirst({
    where: {
      staticId: obj.staticId,
      branchId: obj.branchId,
      isLatest: true,
    },
  });
  if (!latest) {
    throw new Error(
      `Revision without a latest version: ${obj.staticId}/${obj.branchId}`
    );
  }
  // If the latest version is archived, then we processed this job too late
  // and shouldn't email.
  return !latest.isArchived;
}
