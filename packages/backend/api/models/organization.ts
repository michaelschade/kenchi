import { Prisma } from 'prisma-client';

import { expectJsonObject } from './utils';

export type OrganizationSettings = {
  defaultUserGroupMap?: Record<string, number[]>; // domain (or *) to list of group IDs
  defaultSpaceWidgets?: any[]; // SlateNode[]
  disabledMessage?: string;
  intercomAccessToken?: string;
};
export const getSettings = ({
  settings,
}: {
  settings: Prisma.JsonValue;
}): OrganizationSettings => {
  expectJsonObject(settings);
  return settings;
};
