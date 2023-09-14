import uniq from 'lodash/uniq';

import { failure, success } from '@kenchi/shared/lib/Result';

import { ZendeskTagsConfig } from '../../tool/edit/AppActions/ZendeskTagsConfigurator';
import {
  renderRichSlateConfig,
  RichSlateConfig,
} from '../../tool/getRenderedConfiguration';
import { VariableMap } from '../../tool/useVariable';
import { expandInsertionPath } from '../../utils/xpath';
import { PageData } from '../pageData/PageDataController';
import { PageActionRunner } from './types';

// Misnomer. This has nothing to do with Gmail, but the component in the DB is
// still titled "GmailAction". When that is changed it makes sense to rename
// this as well
export type GmailActionConfig = {
  variableMap: VariableMap;
  data: RichSlateConfig;
  intercomTags?: string[];
  zendeskTags?: ZendeskTagsConfig;
  zendeskSetTicketStatus?: string;
  zendeskAssign?: { userId: 'self' };
};

async function applyExternalTags(
  pageDataController: PageData,
  config: GmailActionConfig
) {
  const supportedActions = pageDataController.supportedActions();
  if (config.zendeskTags) {
    const zendeskTagsPromises = [];
    const { tagsToAdd, tagsToSet, tagsToRemove } = config.zendeskTags;
    if (tagsToAdd && supportedActions.includes('addZendeskTags')) {
      const tags = uniq(tagsToAdd);
      if (tags.length > 0) {
        zendeskTagsPromises.push(
          pageDataController.runAction('addZendeskTags', { tags })
        );
      }
    }

    if (tagsToSet && supportedActions.includes('setZendeskTags')) {
      const tags = uniq(tagsToSet);
      if (tags.length > 0) {
        zendeskTagsPromises.push(
          pageDataController.runAction('setZendeskTags', { tags })
        );
      }
    }

    if (tagsToRemove && supportedActions.includes('removeZendeskTags')) {
      const tags = uniq(tagsToRemove);
      if (tags.length > 0) {
        zendeskTagsPromises.push(
          pageDataController.runAction('removeZendeskTags', { tags })
        );
      }
    }
    return Promise.allSettled(zendeskTagsPromises);
  } else if (
    config.intercomTags &&
    supportedActions.includes('addIntercomTags')
  ) {
    const tags = uniq(config.intercomTags);
    if (tags.length > 0) {
      return await pageDataController.runAction('addIntercomTags', { tags });
    }
  }
}

async function assignTicket(
  pageDataController: PageData,
  config: GmailActionConfig
) {
  if (
    config.zendeskAssign?.userId === 'self' &&
    pageDataController.supportedActions().includes('assignZendeskTicketToMe')
  ) {
    return await pageDataController.runAction('assignZendeskTicketToMe');
  }
}

async function setTicketStatus(
  pageDataController: PageData,
  config: GmailActionConfig
) {
  if (
    config.zendeskSetTicketStatus &&
    pageDataController.supportedActions().includes('setZendeskTicketStatus')
  ) {
    return await pageDataController.runAction('setZendeskTicketStatus', {
      ticketStatus: config.zendeskSetTicketStatus,
    });
  }
}

const gmailAction: PageActionRunner<'gmailAction'> = async (
  { messageRouter, pageDataController, domainSettings },
  { configuration }
) => {
  const formatter = pageDataController.getFormatter();
  const data = renderRichSlateConfig(
    configuration.data,
    configuration.variableMap,
    formatter
  );

  await pageDataController.prepareForTextInsertion();
  let path = null;
  if (domainSettings?.insertionPath) {
    path = expandInsertionPath(domainSettings.insertionPath);
  }

  const insertTextPromise = messageRouter.sendCommand(
    'contentScript',
    'insertText',
    { data, path, useSelection: true }
  );

  const [resp] = await Promise.allSettled([
    insertTextPromise,
    applyExternalTags(pageDataController, configuration),
    setTicketStatus(pageDataController, configuration),
    assignTicket(pageDataController, configuration),
  ]);

  return resp.status === 'fulfilled' && resp.value.success
    ? success(true)
    : failure({
        message:
          "Kenchi couldn't determine where to paste this text. Try again by first clicking the text field you want to use, then rerunning this Snippet.",
      });
};

export default gmailAction;
