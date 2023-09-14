import { KenchiMessageRouter } from '@kenchi/commands';
import Result from '@kenchi/shared/lib/Result';

import { DomainSettings } from '../domainSettings/DomainSettingsController';
import { PageData } from '../pageData/PageDataController';
import { EmberMessageBlob } from '../pageData/variableExtractors/EmberSync';
import { GmailActionConfig } from './gmailAction';

export type PageActions = {
  gmailAction: GmailAction;
  extractIntercomData: ExtractIntercomDataAction;
  extractIntercomTags: ExtractIntercomTagsAction;
  addIntercomTags: AddIntercomTagsAction;
  extractZendeskData: ExtractZendeskDataAction;
  extractZendeskTags: ExtractZendeskTagsAction;
  addZendeskTags: AddZendeskTagsAction;
  removeZendeskTags: RemoveZendeskTagsAction;
  setZendeskTags: SetZendeskTagsAction;
  setZendeskTicketStatus: SetZendeskTicketStatusAction;
  assignZendeskTicketToMe: AssignZendeskTicketToMe;
};

export type PageActionType = keyof PageActions;

export type Tag = { id: string; label: string };
export type GmailAction = {
  args: { configuration: GmailActionConfig };
  data: boolean;
};
// Intercom actions
export type ExtractIntercomDataAction = {
  args: {};
  data: EmberMessageBlob[];
};
export type ExtractIntercomTagsAction = {
  args: {};
  data: Tag[];
};
export type AddIntercomTagsAction = {
  args: { tags: string[] };
  data: Tag[];
};

// Zendesk actions
export type ExtractZendeskDataAction = {
  args: {};
  data: unknown[];
};
export type ExtractZendeskTagsAction = {
  args: {};
  data: Tag[];
};
export type AddZendeskTagsAction = {
  args: { tags: string[] };
  data: Tag[];
};
export type SetZendeskTagsAction = {
  args: { tags: string[] };
  data: Tag[];
};
export type RemoveZendeskTagsAction = {
  args: { tags: string[] };
  data: Tag[];
};
export type SetZendeskTicketStatusAction = {
  args: { ticketStatus: string };
  data: string;
};
export type AssignZendeskTicketToMe = {
  args: {};
  data: { group: Object; user: Object | null };
};

export type PageActionRunnerError = {
  message: string;
  data?: Record<string, any>;
};
export type PageActionRunnerResponse<TType extends PageActionType> = Promise<
  Result<PageActions[TType]['data'], PageActionRunnerError>
>;

export type PageActionRunner<TType extends PageActionType> = (
  ctx: {
    messageRouter: KenchiMessageRouter<'app' | 'hud'>;
    pageDataController: PageData;
    domainSettings: DomainSettings | null;
  },
  args: PageActions[TType]['args']
) => PageActionRunnerResponse<TType>;

export type PageActionMap = {
  [key in PageActionType]?: PageActionRunner<key>;
};

export type OptionalIfEmpty<T> = T extends Record<string, never> ? [T?] : [T];
