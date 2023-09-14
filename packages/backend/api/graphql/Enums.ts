import { enumType } from 'nexus';
import {
  AuthTypeEnum as PrismaAuthTypeEnum,
  BranchTypeEnum as PrismaBranchTypeEnum,
  ExternalReferenceTypeEnum as PrismaExternalReferenceTypeEnum,
} from 'prisma-client';

import { collectionPermissionGroups } from '../auth/permissions';

export const AuthTypeEnum = enumType({
  name: 'AuthTypeEnum',
  members: [PrismaAuthTypeEnum.loginAs, PrismaAuthTypeEnum.user],
});

export const BranchTypeEnum = enumType({
  name: 'BranchTypeEnum',
  members: [
    PrismaBranchTypeEnum.draft,
    PrismaBranchTypeEnum.published,
    PrismaBranchTypeEnum.suggestion,
  ], // TODO: remix
});

export const CollectionPermissionEnum = enumType({
  name: 'CollectionPermissionEnum',
  members: collectionPermissionGroups,
});

export const ExternalReferenceTypeEnum = enumType({
  name: 'ExternalReferenceTypeEnum',
  members: [PrismaExternalReferenceTypeEnum.tag],
});
