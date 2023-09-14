import addIntercomTags from './addIntercomTags';
import addZendeskTags from './addZendeskTags';
import assignZendeskTicketToMe from './assignZendeskTicketToMe';
import extractIntercomData from './extractIntercomData';
import extractIntercomTags from './extractIntercomTags';
import extractZendeskData from './extractZendeskData';
import extractZendeskTags from './extractZendeskTags';
import gmailAction from './gmailAction';
import removeZendeskTags from './removeZendeskTags';
import setZendeskTags from './setZendeskTags';
import setZendeskTicketStatus from './setZendeskTicketStatus';
import { PageActionMap } from './types';

export const intercomActions: PageActionMap = {
  extractIntercomData,
  extractIntercomTags,
  addIntercomTags,
};

export const zendeskActions: PageActionMap = {
  extractZendeskData,
  extractZendeskTags,
  addZendeskTags,
  setZendeskTags,
  removeZendeskTags,
  setZendeskTicketStatus,
  assignZendeskTicketToMe,
};

export const defaultActions: PageActionMap = {
  gmailAction,
};
