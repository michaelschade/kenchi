import type {
  AuthTypeEnum,
  Organization,
  PrismaClient,
  User,
  UserGroup,
} from 'prisma-client';

import { CollectionPermissionsDetails } from './permissions';

export type ViewerContext = {
  user: User;
  organization: Organization;

  authType: AuthTypeEnum;
  originalUserId?: number;

  _userGroups: UserGroup[];
  _collectionPermissionsCache: Record<number, CollectionPermissionsDetails>;
};

export type Context = {
  viewerContext: ViewerContext | null;
  session: Express.Request['session'];
  db: PrismaClient;
  csrfToken: () => string;
  loggingContext: Record<string, unknown>;
  __rawRequestForAuthOnly: Express.Request;
};

declare global {
  type NexusContext = Context;
}
