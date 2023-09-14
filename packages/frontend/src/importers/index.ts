import Result from '@kenchi/shared/lib/Result';
import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { DataImportTypeEnum } from '../graphql/generated';
import { ZendeskTagsConfig } from '../tool/edit/AppActions/ZendeskTagsConfigurator';
import csvParse from './csv';
import icParse from './Intercom';
import teParse from './TextExpander';
import zdParse from './Zendesk';

type SlateEntry = { slate: Result<SlateNode[], string> };
type SetZendeskTicketStatusEntry = {
  zendeskSetTicketStatus?: Result<string, string>;
};
type ZendeskTagsEntry = {
  zendeskTags?: Result<ZendeskTagsConfig, string>;
};

type AssignZendeskTicketEntry = {
  // TODO: Support assigning tickets to other users
  zendeskAssign?: Result<{ userId: 'self' }, string>;
};

type IntercomTagsEntrty = {
  intercomTags?: Result<string[], string>;
};

export type ImportEntryAction = SlateEntry &
  SetZendeskTicketStatusEntry &
  ZendeskTagsEntry &
  AssignZendeskTicketEntry &
  IntercomTagsEntrty;

export type ImportEntry = {
  id: string;
  shortcut?: string;
  name: string;
} & ImportEntryAction;

export default function parse(
  type: DataImportTypeEnum,
  initialData: any
): ImportEntry[] {
  switch (type) {
    case DataImportTypeEnum.intercom:
      return icParse(initialData);
    case DataImportTypeEnum.textExpander:
      return teParse(initialData);
    case DataImportTypeEnum.csv:
      return csvParse(initialData);
    case DataImportTypeEnum.zendesk:
      return zdParse(initialData);
  }
}
