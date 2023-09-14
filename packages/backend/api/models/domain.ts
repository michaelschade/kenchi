import { Prisma } from 'prisma-client';

import { expectJsonObject } from './utils';

type HudSettings = {
  inject?: boolean;
};

type SidebarSettings = {
  inject?: boolean;
  defaultOpen?: boolean;
  side?: string;
  customPlacements?: Record<string, { name: string; style: string }>;
};

type DomainSettings = {
  inject?: boolean;
  insertTextXPath?: string; // Deprecated
  insertionPath?: Prisma.JsonObject;
  isGmail?: boolean;
  variableExtractors?: Record<string, Record<string, unknown>>;
  hud?: HudSettings;
  sidebar?: SidebarSettings;
};

// Domain
export const getDomainSettings = ({
  settings,
}: {
  settings: Prisma.JsonValue;
}): DomainSettings => {
  if (settings === null) {
    return {};
  }
  expectJsonObject(settings);
  return settings;
};

// UserDomainSettings
// TODO: rename this to settings and have it be a subset of DomainSettings
export const getDomainInterfaceOptions = ({
  domainInterfaceOptions,
}: {
  domainInterfaceOptions: Prisma.JsonValue;
}): { side?: string; injectHud?: boolean } | null => {
  if (domainInterfaceOptions === null) {
    return null;
  }
  expectJsonObject(domainInterfaceOptions);
  return domainInterfaceOptions;
};
