import { captureMessage } from '@sentry/node';
import type { SourceValue } from 'nexus/dist/typegenTypeHelpers';
import {
  BranchTypeEnum,
  Prisma,
  PrismaPromise,
  Space,
  User,
} from 'prisma-client';

import { ViewerContext } from '../../auth/contextType';
import {
  CollectionPermission,
  hasCollectionPermission,
  hasOrgPermission,
} from '../../auth/permissions';
import { getDB } from '../../db';
import {
  NonPreservableKeys,
  PrismaGeneratedFields,
  VersionedNodeGeneratedFields,
} from '../../models/versionedNode';
import { decodeId, generateStaticId, stripNullOrUndefined } from '../../utils';
import {
  PrismaVersionedNode,
  PrismaVersionedNodeWithoutCollection,
} from '../backingTypes';
import {
  alreadyModifiedError,
  invalidValueError,
  notFoundError,
  permissionError,
  unauthenticatedError,
} from '../KenchiError';

// The list of keys common to all VersionedNode creation calls
const VersionedNodeCreateKeys = [
  'branchedFromId',
  'branchedFrom',
  'branches',
  'branchId',
  'collectionId',
  'collection',
  'createdAt',
  'createdByUserId',
  'createdByUser',
  'id',
  'isArchived',
  'isLatest',
  'branchType',
  'majorChangeDescription',
  'metadata',
  'nextVersions',
  'previousVersionId',
  'previousVersion',
  'staticId',
  'suggestedByUserId',
  'suggestedByUser',
] as const;

const UserSuppliedKeys = [
  'collectionId',
  'branchType',
  'majorChangeDescription',
] as const;

const NeverUserSuppliedKeys = new Set<string>(
  VersionedNodeCreateKeys.filter(
    (k) => !(UserSuppliedKeys as readonly string[]).includes(k)
  )
);

type NeverUserSuppliedKeysType = Exclude<
  typeof VersionedNodeCreateKeys[number],
  typeof UserSuppliedKeys[number]
>;

type PrismaInputs =
  | Prisma.ToolUncheckedCreateInput
  | Prisma.WorkflowUncheckedCreateInput;

type PrismaInputWithoutGeneratedFieldsOrCollectionId<T extends PrismaInputs> =
  Omit<
    T,
    | keyof VersionedNodeGeneratedFields
    | keyof PrismaGeneratedFields
    | 'collectionId'
    | NeverUserSuppliedKeysType
  >;

// Strips out the generated fields and converts collectionId to a string, should
// match the inputs we take on prisma object creation.
export type PrismaInputToNexusCreateInput<T extends PrismaInputs> =
  PrismaInputWithoutGeneratedFieldsOrCollectionId<T> & {
    collectionId: string;
  };
type PartialOrNull<T> = {
  [P in keyof T]?: T[P] | null;
};
type PrismaInputToNexusUpdateInput<T extends PrismaInputs> = PartialOrNull<
  PrismaInputWithoutGeneratedFieldsOrCollectionId<T>
> & { collectionId?: string | null };

type TestStringSubset<T extends string, U extends string> = T extends U
  ? true
  : false;
const _testVNGF: () => TestStringSubset<
  NeverUserSuppliedKeysType,
  keyof VersionedNodeGeneratedFields
> = () => true;
const _testPGF: () => TestStringSubset<
  NeverUserSuppliedKeysType,
  keyof PrismaGeneratedFields
> = () => true;

// Given a previous version (or not), return all fields that are in
// VersionedNode interface, and therefore don't care if we're dealing with a
// Workflow or a Tool. This can be passed to prisma.*.create as data.
export function versionedNodeGeneratedFields(
  user: User,
  node: PrismaVersionedNode | null,
  prefix?: string
): VersionedNodeGeneratedFields {
  let staticId: string;
  if (node) {
    staticId = node.staticId;
  } else {
    if (!prefix) {
      throw new Error('Expected a prefix when not supplying a node');
    }
    staticId = generateStaticId(prefix);
  }
  return {
    isLatest: true,
    staticId,
    previousVersionId: node?.id,
    createdByUserId: user.id,
    suggestedByUserId: node?.suggestedByUserId,
    branchedFromId: node?.branchedFromId,
    branchId: node?.branchId,
  };
}

type WithOnlyMajorType<T> = T & {
  NOT?: { majorChangeDescription?: { equals: 'DbNull' } };
};
export function withOnlyMajor<T extends Record<string, unknown>>(
  onlyMajor: boolean | null | undefined,
  where: T
): WithOnlyMajorType<T> {
  if (onlyMajor) {
    return {
      ...where,
      majorChangeDescription: { not: { equals: Prisma.DbNull } },
    };
  }
  return where;
}

type FindOneDBCall<TModel extends PrismaVersionedNode> = {
  findUnique: (args: { where: { id: number } }) => PrismaPromise<TModel | null>;
};
type FindManyDBCall<TModel extends PrismaVersionedNode> = {
  findMany: (args: {
    where: {
      staticId: string;
      isLatest: boolean;
      isArchived?: boolean;
      createdByUserId?: number;
      branchType: BranchTypeEnum;
    };
  }) => PrismaPromise<TModel[]>;
};
type CreateAndUpdateDBCalls<
  TCreateInput extends PrismaInputs,
  TModel extends PrismaVersionedNode
> = {
  create: (query: { data: TCreateInput }) => PrismaPromise<TModel>;
  update: (query: {
    where: { id: number };
    data: { isLatest?: boolean; metadata?: Prisma.InputJsonValue };
  }) => PrismaPromise<TModel>;
};

type Rtn<TModel extends PrismaVersionedNode> = Promise<
  | { error: SourceValue<'KenchiError'>; model?: never }
  | { error?: never; model: TModel }
>;

async function validateMerge<
  TModel extends PrismaVersionedNodeWithoutCollection
>(
  fromId: string,
  toId: string | null | undefined,
  viewerContext: ViewerContext | null,
  { findUnique, findMany }: FindOneDBCall<TModel> & FindManyDBCall<TModel>
): Promise<
  [SourceValue<'KenchiError'>, null, null] | [null, TModel, TModel | null]
> {
  const fromIdLoad = await loadForUpdate(
    fromId,
    (model: TModel) =>
      hasCollectionPermission(
        viewerContext,
        model.collectionId,
        'see_collection'
      ),
    findUnique
  );
  if (fromIdLoad[0]) {
    return [fromIdLoad[0], null, null];
  }
  const [, fromModel] = fromIdLoad;

  let toModel: TModel | null = null;
  if (toId) {
    const toIdLoad = await loadForUpdate(
      toId,
      (model: TModel) =>
        hasCollectionPermission(
          viewerContext,
          model.collectionId,
          'see_collection'
        ),
      findUnique
    );
    if (toIdLoad[0]) {
      return [toIdLoad[0], null, null];
    }
    toModel = toIdLoad[1];
  }

  if (toModel) {
    if (fromModel.staticId !== toModel.staticId) {
      return [
        invalidValueError(
          'Can only merge items with the same staticId',
          'toId'
        ),
        null,
        null,
      ];
    }

    if (toModel.branchType !== BranchTypeEnum.published) {
      return [
        invalidValueError('Can only merge into published items', 'toId'),
        null,
        null,
      ];
    }
  } else {
    const [existingModel] = await findMany({
      where: {
        staticId: fromModel.staticId,
        isLatest: true,
        branchType: BranchTypeEnum.published,
      },
    });
    if (existingModel) {
      return [alreadyModifiedError(), null, null];
    }
  }

  return [null, fromModel, toModel];
}

export async function hasSpaceModifyPermission(
  viewerContext: ViewerContext | null,
  model: Space
): Promise<boolean> {
  if (!viewerContext) {
    return false;
  }
  const user = viewerContext.user;

  if (
    model.organizationId &&
    hasOrgPermission(user, 'manage_spaces', model.organizationId)
  ) {
    return true;
  }
  const acl = await getDB().spaceAcl.findFirst({
    where: {
      staticId: model.staticId,
      OR: [
        { userId: user.id },
        {
          userGroup: {
            members: { some: { userId: user.id, manager: true } },
          },
        },
      ],
    },
  });
  return !!acl;
}

export async function loadForUpdate<TModel extends PrismaVersionedNode>(
  id: string,
  permissionCheck: (model: TModel) => Promise<boolean> | boolean,
  findUnique: FindOneDBCall<TModel>['findUnique']
): Promise<[SourceValue<'KenchiError'>, null] | [null, TModel]> {
  const [, decodedId] = decodeId(id);
  const model = await findUnique({ where: { id: decodedId } });

  if (!model) {
    return [notFoundError(), null];
  }

  if (!(await permissionCheck(model))) {
    captureMessage('Attempt to update object with insufficient permissions', {
      extra: { id },
    });
    return [notFoundError(), null];
  }

  // We have a conditional unique index that fails if you try to make multiple
  // items with the same static_id is_latest, so this technically isn't
  // necessary. We should probably catch that error on commit instead.
  if (!model.isLatest) {
    return [alreadyModifiedError(), null];
  }

  return [null, model];
}

async function getCollectionId(
  viewerContext: ViewerContext | null,
  encodedCollectionId: string
): Promise<number | null> {
  let collectionId: number;
  try {
    collectionId = decodeId(encodedCollectionId)[1];
  } catch (e) {
    return null;
  }

  if (
    !(await hasCollectionPermission(
      viewerContext,
      collectionId,
      'see_collection'
    ))
  ) {
    return null;
  }

  return collectionId;
}

export async function executeCreate<
  TCreateInput extends PrismaInputs,
  TModel extends PrismaVersionedNode
>(
  permission: CollectionPermission,
  staticIdPrefix: string,
  branchIdPrefix: string,
  inputData: PrismaInputToNexusCreateInput<TCreateInput>,
  viewerContext: ViewerContext | null,
  { create }: { create: (query: { data: TCreateInput }) => Promise<TModel> }
): Rtn<TModel> {
  if (!viewerContext) {
    return { error: unauthenticatedError() };
  }
  const user = viewerContext.user;

  const collectionId = await getCollectionId(
    viewerContext,
    inputData.collectionId
  );
  if (!collectionId) {
    return { error: notFoundError('collectionId') };
  }

  if (
    inputData.branchType === BranchTypeEnum.published &&
    !(await hasCollectionPermission(viewerContext, collectionId, permission))
  ) {
    return { error: permissionError() };
  }

  const badKeys = Object.keys(inputData).filter((key) =>
    NeverUserSuppliedKeys.has(key)
  );
  if (badKeys.length > 0) {
    throw new Error(`Unexpected keys in user input: ${badKeys.join(', ')}`);
  }

  const generatedData = versionedNodeGeneratedFields(
    user,
    null,
    staticIdPrefix
  );

  const createData = {
    ...inputData,
    collectionId,
    majorChangeDescription: inputData.majorChangeDescription ?? Prisma.DbNull,
  };

  // For a large variety of reasons this causes a "could be instantiated with an
  // arbitrary type which could be unrelated to" error. The easiest fix would be
  // for TS to add an Exact<> type, or to allow generics to be used for specific
  // options, not all expanding options. It sucks that we lose type safety here.
  // See https://github.com/microsoft/TypeScript/issues/12936
  const data: TCreateInput = {
    ...generatedData,
    ...createData,
  } as any;

  if (inputData.branchType !== BranchTypeEnum.published) {
    data.branchId = generateStaticId(branchIdPrefix);
    data.suggestedByUserId = user.id;
  }

  const model = await create({ data });

  return { model };
}

export async function executeUpdate<
  TCreateInput extends PrismaInputs,
  TModel extends PrismaVersionedNodeWithoutCollection
>(
  permission: CollectionPermission,
  branchPrefix: string,
  id: string,
  inputData: PrismaInputToNexusUpdateInput<TCreateInput>,
  preservableFn: (model: TModel) => Omit<TCreateInput, NonPreservableKeys>,
  viewerContext: ViewerContext | null,
  {
    findUnique,
    findMany,
    create,
    update,
  }: FindOneDBCall<TModel> &
    FindManyDBCall<TModel> &
    CreateAndUpdateDBCalls<TCreateInput, TModel>
): Rtn<TModel> {
  if (!viewerContext) {
    return { error: unauthenticatedError() };
  }
  const user = viewerContext.user;

  const idLoad = await loadForUpdate(
    id,
    (model: TModel) =>
      hasCollectionPermission(
        viewerContext,
        model.collectionId,
        'see_collection'
      ),
    findUnique
  );
  if (idLoad[0]) {
    return { error: idLoad[0] };
  }
  const [, existingModel] = idLoad;

  let collectionId;
  const { collectionId: updateCollectionId, ...updateDataWithNull } = inputData;
  if (updateCollectionId) {
    collectionId = await getCollectionId(viewerContext, updateCollectionId);
    if (!collectionId) {
      return { error: notFoundError('collectionId') };
    }
  }

  const branchType = inputData.branchType || existingModel.branchType;
  switch (branchType) {
    case BranchTypeEnum.remix:
      throw new Error('Not implemented');
    case BranchTypeEnum.published:
      if (
        collectionId &&
        !(await hasCollectionPermission(
          viewerContext,
          collectionId,
          permission
        ))
      ) {
        return { error: permissionError() };
      }
      if (
        !(await hasCollectionPermission(
          viewerContext,
          existingModel.collectionId,
          permission
        ))
      ) {
        return { error: permissionError() };
      }
      break;
    default:
      if (existingModel.branchType === BranchTypeEnum.published) {
        const [alreadyHasBranchType] = await findMany({
          where: {
            branchType,
            isLatest: true,
            isArchived: false,
            staticId: existingModel.staticId,
            createdByUserId: user.id,
          },
        });
        if (alreadyHasBranchType) {
          return {
            error: invalidValueError(
              `You can only have one pending ${branchType} at a time for this item. Please edit your existing ${branchType} instead.`,
              'branchType'
            ),
          };
        }
      } else {
        // TODO: when we let people make drafts off of existing workflows
        // we need to update this, as we'll permit people to turn a draft
        // into a suggestion even if they already have a suggestion.

        // Anybody can save drafts, make suggestions, or leave type
        // unchanged as long as it's their own
        if (existingModel.createdByUserId !== user.id) {
          return { error: notFoundError() };
        }
      }
  }

  const generatedData = versionedNodeGeneratedFields(user, existingModel);
  const preservableData = preservableFn(existingModel);
  const updateData = stripNullOrUndefined({
    ...updateDataWithNull,
    collectionId,
  });

  // For a large variety of reasons this causes a "could be instantiated with an
  // arbitrary type which could be unrelated to" error. The easiest fix would be
  // for TS to add an Exact<> type, or to allow generics to be used for specific
  // options, not all expanding options. It sucks that we lose type safety here.
  // See https://github.com/microsoft/TypeScript/issues/12936
  const data: TCreateInput = {
    ...generatedData,
    ...preservableData,
    ...updateData,
  } as any;

  let model: TModel;
  if (
    existingModel.branchType === BranchTypeEnum.published &&
    branchType !== BranchTypeEnum.published
  ) {
    // published => !published: If we're creating a draft/suggestion don't want
    // to un-isLatest the published tool
    data.branchedFromId = existingModel.id;
    data.branchId = generateStaticId(branchPrefix);
    data.suggestedByUserId = user.id;
    model = await create({ data });
  } else if (
    existingModel.branchType !== BranchTypeEnum.published &&
    branchType === BranchTypeEnum.published
  ) {
    // !published => published: Should never happen
    return {
      error: invalidValueError(
        'This item has already been submitted as a suggestion. To publish this automation, review it through the Suggestions page on the Dashboard.',
        'branchType'
      ),
    };
  } else {
    // published => published
    const res = await getDB().$transaction([
      update({
        where: { id: existingModel.id },
        data: { isLatest: false },
      }),
      create({ data }),
    ]);
    model = res[1];
  }

  return { model };
}

export async function executeMerge<
  TCreateInput extends PrismaInputs,
  TModel extends PrismaVersionedNodeWithoutCollection
>(
  permission: CollectionPermission,
  fromId: string,
  toId: string | null | undefined,
  inputData: PrismaInputToNexusUpdateInput<TCreateInput>,
  preservableFn: (model: TModel) => Omit<TCreateInput, NonPreservableKeys>,
  viewerContext: ViewerContext | null,
  {
    create,
    update,
    ...fetchCalls
  }: CreateAndUpdateDBCalls<TCreateInput, TModel> &
    FindOneDBCall<TModel> &
    FindManyDBCall<TModel>
): Rtn<TModel> {
  if (!viewerContext) {
    return { error: unauthenticatedError() };
  }
  const user = viewerContext.user;

  const badKeys = Object.keys(inputData).filter((key) =>
    NeverUserSuppliedKeys.has(key)
  );
  if (badKeys.length > 0) {
    throw new Error(`Unexpected keys in user input: ${badKeys.join(', ')}`);
  }

  const validatedModels = await validateMerge(
    fromId,
    toId,
    viewerContext,
    fetchCalls
  );
  if (validatedModels[0]) {
    return { error: validatedModels[0] };
  }
  const [, fromModel, toModel] = validatedModels;

  // TODO(permissions): right now if there's a published workflow with
  // collection C1, and a suggestion to change it to collection C2, but the
  // suggestion reviewer decides to override and change it to C3, the reviewer
  // must have suggestion approval permissions on all 3 collections. This is
  // probably wrong but at least it's very safe.
  if (fromModel.branchType === BranchTypeEnum.suggestion) {
    permission = 'review_suggestions';
  }

  let collectionId = undefined;
  const { collectionId: inputCollectionId, ...updateDataWithNull } = inputData;
  if (inputCollectionId) {
    collectionId = await getCollectionId(viewerContext, inputCollectionId);
    if (!collectionId) {
      return { error: notFoundError('collectionId') };
    }
    if (
      !(await hasCollectionPermission(viewerContext, collectionId, permission))
    ) {
      return { error: permissionError() };
    }
  }

  const branchType = inputData.branchType || toModel?.branchType;
  if (branchType !== BranchTypeEnum.published) {
    return {
      error: invalidValueError(
        'Can only merge into published items',
        inputData.branchType ? 'branchType' : 'toId'
      ),
    };
  }

  if (
    !(await hasCollectionPermission(
      viewerContext,
      fromModel.collectionId,
      permission
    ))
  ) {
    return { error: permissionError() };
  }

  if (
    toModel &&
    !(await hasCollectionPermission(
      viewerContext,
      toModel.collectionId,
      permission
    ))
  ) {
    return { error: permissionError() };
  }

  const generatedData = versionedNodeGeneratedFields(user, fromModel);
  const preservableData = preservableFn(fromModel);

  const updateData = stripNullOrUndefined({
    ...updateDataWithNull,
    collectionId,
  });

  // With normal updates we don't keep majorChangeDescription, but when
  // merging we do if it's not explicitly unset by new data.
  const majorChangeDescription =
    (updateDataWithNull.majorChangeDescription === undefined
      ? fromModel.majorChangeDescription
      : updateDataWithNull.majorChangeDescription) ?? undefined;

  // For a large variety of reasons this causes a "could be instantiated with an
  // arbitrary type which could be unrelated to" error. The easiest fix would be
  // for TS to add an Exact<> type, or to allow generics to be used for specific
  // options, not all expanding options. It sucks that we lose type safety here.
  // See https://github.com/microsoft/TypeScript/issues/12936
  const data: TCreateInput = {
    ...generatedData,
    ...preservableData,
    ...updateData,
    branchType,
    majorChangeDescription,
  } as any;

  // There's an optional 4th in this tuple, but we don't need the return value so *shrug*
  const txns: [
    PrismaPromise<TModel>,
    PrismaPromise<TModel>,
    PrismaPromise<TModel>
  ] = [
    create({
      data: {
        ...data,
        branchId: null,
        branchedFromId: undefined,
        previousVersionId: toModel?.id,
      },
    }),
    // Update the branch to be deleted
    update({
      where: { id: fromModel.id },
      data: { isLatest: false },
    }),
    create({
      data: {
        ...data,
        branchType: fromModel.branchType, // Leave as old branchType
        isArchived: true,
      },
    }),
  ];
  let offset;
  if (toModel) {
    // Update the published version. We ensured this isLatest higher up
    txns.unshift(
      update({
        where: { id: toModel.id },
        data: { isLatest: false },
      })
    );
    offset = 1;
  } else {
    offset = 0;
  }

  const res = await getDB().$transaction(txns);
  const published = res[offset];
  const deletedBranch = res[offset + 2];
  const [finalPublished] = await getDB().$transaction([
    update({
      where: { id: published.id },
      data: {
        metadata: {
          mergedFromId: deletedBranch.id,
        },
      },
    }),
    update({
      where: { id: deletedBranch.id },
      data: {
        metadata: {
          archiveReason: 'approved',
          mergedToId: published.id,
        },
      },
    }),
  ]);

  return { model: finalPublished };
}

export async function executeDelete<
  TCreateInput extends PrismaInputs,
  TModel extends PrismaVersionedNodeWithoutCollection
>(
  permission: CollectionPermission,
  id: string,
  preservableFn: (model: TModel) => Omit<TCreateInput, NonPreservableKeys>,
  viewerContext: ViewerContext | null,
  model: CreateAndUpdateDBCalls<TCreateInput, TModel> & FindOneDBCall<TModel>
): Rtn<TModel> {
  return _executeDeleteOrRestore(
    permission,
    id,
    preservableFn,
    'delete',
    viewerContext,
    model
  );
}

export async function executeRestore<
  TCreateInput extends PrismaInputs,
  TModel extends PrismaVersionedNodeWithoutCollection
>(
  permission: CollectionPermission,
  id: string,
  preservableFn: (model: TModel) => Omit<TCreateInput, NonPreservableKeys>,
  viewerContext: ViewerContext | null,
  model: CreateAndUpdateDBCalls<TCreateInput, TModel> & FindOneDBCall<TModel>
): Rtn<TModel> {
  return _executeDeleteOrRestore(
    permission,
    id,
    preservableFn,
    'restore',
    viewerContext,
    model
  );
}

async function _executeDeleteOrRestore<
  TCreateInput extends PrismaInputs,
  TModel extends PrismaVersionedNodeWithoutCollection
>(
  permission: CollectionPermission,
  id: string,
  preservableFn: (model: TModel) => Omit<TCreateInput, NonPreservableKeys>,
  operation: 'delete' | 'restore',
  viewerContext: ViewerContext | null,
  {
    create,
    update,
    findUnique,
  }: CreateAndUpdateDBCalls<TCreateInput, TModel> & FindOneDBCall<TModel>
): Rtn<TModel> {
  if (!viewerContext) {
    return { error: unauthenticatedError() };
  }
  const user = viewerContext.user;

  const idLoad = await loadForUpdate(
    id,
    (model: TModel) =>
      hasCollectionPermission(
        viewerContext,
        model.collectionId,
        'see_collection'
      ),
    findUnique
  );
  if (idLoad[0]) {
    return { error: idLoad[0] };
  }
  const [, existingModel] = idLoad;

  switch (existingModel.branchType) {
    case BranchTypeEnum.published:
      if (
        !(await hasCollectionPermission(
          viewerContext,
          existingModel.collectionId,
          permission
        ))
      ) {
        return { error: permissionError() };
      }
      break;
    case BranchTypeEnum.suggestion:
      if (
        !(await hasCollectionPermission(
          viewerContext,
          existingModel.collectionId,
          'review_suggestions'
        )) &&
        existingModel.createdByUserId !== user.id
      ) {
        return { error: permissionError() };
      }
      break;
    default:
      if (existingModel.createdByUserId !== user.id) {
        console.error(
          'Attempt to delete a non-published item from a different user',
          id
        );
        return { error: notFoundError() };
      }
      break;
  }

  let isArchived;
  let metadata;
  switch (operation) {
    case 'delete':
      if (existingModel.isArchived) {
        return {
          error: invalidValueError('This has already been archived'),
        };
      }
      isArchived = true;
      if (existingModel.branchType === BranchTypeEnum.suggestion) {
        metadata = { archiveReason: 'rejected' };
      }
      break;
    case 'restore':
      if (!existingModel.isArchived) {
        return {
          error: invalidValueError('Only archived things can be restored'),
        };
      }
      if (
        existingModel.branchType !== BranchTypeEnum.published &&
        existingModel.branchType !== BranchTypeEnum.draft
      ) {
        return {
          error: invalidValueError(
            'Only published or draft items can be restored'
          ),
        };
      }
      isArchived = false;
      break;
    default:
      const unhandledCase: never = operation;
      throw new Error(`Unhandled case: ${unhandledCase}`);
  }

  const generatedData = versionedNodeGeneratedFields(
    viewerContext.user,
    existingModel
  );
  const preservableData = preservableFn(existingModel);

  // For a large variety of reasons this causes a "could be instantiated with an
  // arbitrary type which could be unrelated to" error. The easiest fix would be
  // for TS to add an Exact<> type, or to allow generics to be used for specific
  // options, not all expanding options. It sucks that we lose type safety here.
  // See https://github.com/microsoft/TypeScript/issues/12936
  const data: TCreateInput = {
    ...generatedData,
    ...preservableData,
    isArchived,
    metadata,
  } as any;

  const [, model] = await getDB().$transaction([
    update({
      where: { id: existingModel.id },
      data: { isLatest: false },
    }),
    create({ data }),
  ]);

  return { model };
}
