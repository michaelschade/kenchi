import isEqual from 'fast-deep-equal';

import { KenchiMessageRouter } from '@kenchi/commands';
import { MessageBlob } from '@michaelschade/kenchi-message-router';

import { isMessageRouterErrorType } from '../../../utils';
import { Context, Extractor, VariableListener } from '.';

export default class GmailExtractor implements Extractor {
  private messageRouter?: KenchiMessageRouter<'app' | 'hud'>;
  private listeners: VariableListener[] = [];
  private lastVariables: MessageBlob | null = null;

  initialize(messageRouter: KenchiMessageRouter<'app' | 'hud'>) {
    this.messageRouter = messageRouter;
    const handler = (variables: MessageBlob) => this.updateVariables(variables);
    messageRouter.addCommandHandler(
      'contentScript',
      'gmail:updateVariables',
      handler
    );
    this.requestVariables(messageRouter);
    return () =>
      messageRouter.removeCommandHandler(
        'contentScript',
        'gmail:updateVariables',
        handler
      );
  }

  // In v0.22 there is a race condition between InboxSDK and the HUD: we don't
  // register listeners until the SDK fully initializes, which used to be fast
  // but got slow (probably because it's waiting for some DOM element to appear
  // that's no longer there in Gmail's latest UI change). Hack around it by
  // retrying the requestVariables command. v0.23 fixes this.
  async requestVariables(messageRouter: KenchiMessageRouter<'app' | 'hud'>) {
    try {
      await messageRouter.sendCommand(
        'contentScript',
        'gmail:requestVariables'
      );
    } catch (e) {
      if (isMessageRouterErrorType(e, 'noHandler')) {
        window.setTimeout(() => this.requestVariables(messageRouter), 1000);
      }
    }
  }

  // We don't care about URL
  setContext(_context: Context) {}

  addListener(listener: VariableListener) {
    this.listeners.push(listener);
  }

  getPossibleVariables() {
    return [
      { id: 'authorEmail', placeholder: 'Author email' },
      { id: 'authorDomain', placeholder: 'Author domain' },
      { id: 'authorName', placeholder: 'Author name' },
      { id: 'authorFirstName', placeholder: 'Author first name' },
      { id: 'recipientEmail', placeholder: 'Recipient email' },
      { id: 'recipientDomain', placeholder: 'Recipient domain' },
      { id: 'recipientName', placeholder: 'Recipient name' },
      { id: 'recipientFirstName', placeholder: 'Recipient first name' },
    ];
  }

  private updateVariables = async (gmail: MessageBlob) => {
    const variables = this.parseVariables(gmail);
    if (isEqual(variables, this.lastVariables)) {
      return;
    }

    this.lastVariables = variables;
    this.listeners.forEach((l) => l(variables));
  };

  private deprecatedUpdateVariables = async () => {
    const variables = await this.deprecatedGetVariables();
    window.setTimeout(this.deprecatedUpdateVariables, 1000);
    if (isEqual(variables, this.lastVariables)) {
      return;
    }

    this.lastVariables = variables;
    this.listeners.forEach((l) => l(variables));
  };

  async deprecatedGetVariables(): Promise<MessageBlob> {
    if (!this.messageRouter) {
      throw new Error('Must initialize before calling getVariables');
    }

    let gmail;
    try {
      gmail = await this.messageRouter.sendCommand(
        'contentScript',
        'gmailGetActive'
      );
    } catch (e) {
      // Ignoring for now since we don't focus much on gmail and seem to get a bunch of timeouts
      return {};
    }

    return this.parseVariables(gmail || {});
  }

  private parseVariables(gmail: Record<string, any>) {
    const activeVariables: { [key: string]: string } = {};
    const from = gmail.fromContact;
    if (from) {
      activeVariables.authorEmail = from.emailAddress;
      activeVariables.authorDomain = activeVariables.authorEmail?.split('@')[1];
      if (from.name && from.name !== from.emailAddress) {
        activeVariables.authorName = from.name;
        activeVariables.authorFirstName = from.name.split(' ')[0];
      }
    }

    const recipients = gmail.toRecipients;
    if (recipients && recipients.length > 0) {
      // TODO: handle multiple recipients?
      const recipient = recipients[0];
      activeVariables.recipientEmail = recipient.emailAddress;
      activeVariables.recipientDomain =
        activeVariables.recipientEmail?.split('@')[1];
      if (recipient.name && recipient.name !== recipient.emailAddress) {
        activeVariables.recipientName = recipient.name;
        activeVariables.recipientFirstName = recipient.name.split(' ')[0];
      }
    }

    return activeVariables;
  }
}
