import { Prisma } from 'prisma-client';

import { expectJsonObject } from './utils';

export type UserInfo = {
  picture?: string;
  family_name?: string;
};
export const getUserinfoLatest = ({
  userinfoLatest,
}: {
  userinfoLatest: Prisma.JsonValue;
}): UserInfo | null => {
  if (!userinfoLatest) {
    return null;
  }
  expectJsonObject(userinfoLatest);
  return userinfoLatest;
};
