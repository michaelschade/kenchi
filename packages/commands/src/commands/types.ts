import { CommandsForDestination } from '@michaelschade/kenchi-message-router';

export type Conforms<T extends CommandsForDestination> = T;

export type SharedSettingsResp = {
  inject: boolean | null;
  injectHud: boolean | 'deferred' | null;
  injectSidebar: boolean | null;
  isGmail: boolean | null;
  initialStyle: string | null;
};

export type AutomationWithTimeoutArgs = {
  xpath: string;
  timeout: number;
  async?: boolean;
  id?: string;
};

export type AutomationResp = {
  success: boolean;
  id?: string;
  error?: any;
};

export type ProposeNewSnippetArgs = {
  html?: string;
  text?: string;
};
