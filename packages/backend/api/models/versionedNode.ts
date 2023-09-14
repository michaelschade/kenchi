import { captureMessage } from '@sentry/node';
import { BranchTypeEnum, Prisma, Tool, Workflow } from 'prisma-client';

import { hasCollectionPermission, loggedInUser } from '../auth/permissions';
import { PrismaVersionedNode } from '../graphql/backingTypes';
import { isAdmin } from '../utils';

type VersionedNodeMetadata = {
  mergedToId?: number;
  mergedFromId?: number;
  archiveReason?: 'approved' | 'rejected';
  initialContent?: string; // For walkthrough
  migration?: { reason: string; employee: string };
};

export const getMetadata = ({
  metadata,
}: {
  metadata: Prisma.JsonValue;
}): VersionedNodeMetadata => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Expected metadata to be an object');
  }
  return metadata;
};

// TODO: this logic is nearly identical to util's getVersionedNode. Find an
// elegant way to abstract them out, especially because inconsistencies will
// cause shield errors (and pages).
export const canView = async (
  ctx: NexusContext,
  obj: PrismaVersionedNode
): Promise<boolean> => {
  if (isAdmin()) {
    return true;
  }

  const user = loggedInUser(ctx);
  if (!user) {
    return false;
  }

  if (!('collectionId' in obj)) {
    // Can see any space in your org
    // TODO: revisit when we have non-published spaces
    // TODO: add ACL check
    if (obj.organizationId && obj.organizationId === user.organizationId) {
      return true;
    }
    return false;
  }

  switch (obj.branchType) {
    case BranchTypeEnum.draft:
    case BranchTypeEnum.remix:
      // Only the creator of drafts can view them, regardless of collection
      return user.id === obj.createdByUserId;
    case BranchTypeEnum.suggestion: {
      // The creator or suggestor of suggestions can always view them,
      // regardless of collection (though others may also be able to view)
      if (
        obj.branchType === BranchTypeEnum.suggestion &&
        (user.id === obj.createdByUserId || user.id === obj.suggestedByUserId)
      ) {
        return true;
      }
      const collectionId = await getCollectionIdForPermissions(ctx, obj);
      return hasCollectionPermission(
        ctx.viewerContext,
        collectionId,
        'review_suggestions'
      );
    }
    case BranchTypeEnum.published: {
      const collectionId = await getCollectionIdForPermissions(ctx, obj);
      return hasCollectionPermission(
        ctx.viewerContext,
        collectionId,
        'see_collection'
      );
    }
  }
};

// The collection ID for permissions checks on a tool/workflow:
// - latest published collection if exists (may not if, e.g. new suggestion)
// - otherwise latest collection on your branch if exists (this should always exist)
// - otherwise own collection (as fallback)
async function getCollectionIdForPermissions(
  ctx: NexusContext,
  obj: Tool | Workflow
): Promise<number> {
  if (obj.isLatest && obj.branchType === BranchTypeEnum.published) {
    return obj.collectionId;
  }

  let findFirst: (input: {
    select: {
      collectionId: true;
    };
    where: {
      staticId: string;
      branchId?: string | null;
      branchType?: BranchTypeEnum;
      isLatest: boolean;
    };
  }) => Promise<{ collectionId: number } | null>;
  if (obj.staticId.startsWith('tool_')) {
    // TODO: above tool_ check is jank
    findFirst = ctx.db.tool.findFirst;
  } else {
    findFirst = ctx.db.workflow.findFirst;
  }

  const latestPublished = await findFirst({
    select: { collectionId: true },
    where: {
      staticId: obj.staticId,
      branchType: BranchTypeEnum.published,
      isLatest: true,
    },
  });
  if (latestPublished) {
    return latestPublished.collectionId;
  }

  if (!obj.isLatest) {
    const latestForBranch = await findFirst({
      select: { collectionId: true },
      where: {
        staticId: obj.staticId,
        branchId: obj.branchId,
        isLatest: true,
      },
    });
    if (latestForBranch) {
      return latestForBranch.collectionId;
    }
  }

  return obj.collectionId;
}

// Fields that we should always strip from previous versions because Prisma
// fills them in for us.
export type PrismaGeneratedFields = {
  id: number;
  createdAt: Date;
};

// Fields that are common to VersionedNodes but do not get preserved across versions
type VersionedNodeUnpreservedFields = {
  majorChangeDescription: string | null | undefined;
  metadata: Prisma.JsonValue | undefined;
};

// This should have the same number of keys as the return of
// versionedNodeGeneratedFields.
export type VersionedNodeGeneratedFields = {
  isLatest: boolean;
  staticId: string;
  previousVersionId: number | null | undefined;
  createdByUserId: number;
  suggestedByUserId: number | null | undefined;
  branchedFromId: number | null | undefined;
  branchId: string | null | undefined;
};

// Everything left: all the fields that are specific to Tool or Workflow, are
// preservable: you can safely copy from one version to the next.
export type NonPreservableKeys =
  | keyof PrismaGeneratedFields
  | keyof VersionedNodeUnpreservedFields
  | keyof VersionedNodeGeneratedFields;

export function generateModel<
  TFindManyArgs,
  TFindFirstArgs,
  TUncheckedCreateInput,
  TModel extends PrismaVersionedNode
>(
  staticIdPrefix: string,
  branchIdPrefix: string,
  revisionIdPrefix: string,
  transformPreservableFields: (
    partialModel: Omit<TModel, NonPreservableKeys>
  ) => Omit<TUncheckedCreateInput, NonPreservableKeys>,
  loader: (ctx: NexusContext) => {
    findUnique: (args: { where: { id: number } }) => Promise<TModel | null>;
    findMany: <T>(args: T) => Promise<TModel[]>;
    findFirst: <T>(args: T) => Promise<TModel | null>;
  }
) {
  return {
    staticIdPrefix,
    branchIdPrefix,
    revisionIdPrefix,
    preservableFields: (model: TModel) => {
      const {
        // PrismaGeneratedFields
        id,
        createdAt,
        // VersionedNodeUnpreservedFields
        majorChangeDescription,
        metadata,
        // VersionedNodeGeneratedFields
        isLatest,
        staticId,
        previousVersionId,
        createdByUserId,
        suggestedByUserId,
        branchedFromId,
        branchId,
        ...rest
      } = model;
      return transformPreservableFields(rest);
    },
    async findById(ctx: NexusContext, id: number) {
      const result = await loader(ctx).findUnique({
        where: { id },
      });
      if (!result) {
        return null;
      }
      if (!(await canView(ctx, result))) {
        captureMessage('Tried to load unpermitted object', { extra: { id } });
        // TODO: enable this once we see Sentry is clean
        // return null;
      }
      return result;
    },

    async findMany(ctx: NexusContext, args: TFindManyArgs) {
      const results = await loader(ctx).findMany<TFindManyArgs>(args);

      const canViewResults = await Promise.all(
        results.map(async (obj) => [await canView(ctx, obj), obj.id] as const)
      );
      const notPermitted = canViewResults.filter(([canView]) => !canView);
      if (notPermitted.length > 0) {
        captureMessage('Tried to load unpermitted object in list', {
          extra: { ids: notPermitted.map(([, id]) => id) },
          level: 'debug',
        });
        // TODO: enable this once we see Sentry is clean
        // return [];
      }
      return results;
    },

    async findFirst(ctx: NexusContext, args: TFindFirstArgs) {
      const result = await loader(ctx).findFirst<TFindFirstArgs>(args);

      if (!result) {
        return null;
      }
      if (!(await canView(ctx, result))) {
        captureMessage('Tried to load unpermitted object in first', {
          extra: { id: result.id },
          level: 'debug',
        });
        return null;
      }
      return result;
    },
  };
}
