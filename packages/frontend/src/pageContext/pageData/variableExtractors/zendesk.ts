import isEqual from 'fast-deep-equal';

import { KenchiMessageRouter } from '@kenchi/commands';
import { MessageBlob } from '@michaelschade/kenchi-message-router';

import { Context, Extractor, VariableListener } from '.';

export default class ZendeskExtractor implements Extractor {
  private messageRouter?: KenchiMessageRouter<'app' | 'hud'>;
  private listeners: VariableListener[] = [];
  private lastVariables: MessageBlob | null = null;

  initialize(messageRouter: KenchiMessageRouter<'app' | 'hud'>) {
    this.messageRouter = messageRouter;
    messageRouter.sendCommand('contentScript', 'injectScript', {
      name: 'zendesk',
    });
    window.setTimeout(this.updateVariables, 1000);
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

  private updateVariables = async () => {
    const variables = await this.getVariables();
    window.setTimeout(this.updateVariables, 2000);
    if (isEqual(variables, this.lastVariables)) {
      return;
    }

    this.lastVariables = variables;
    this.listeners.forEach((l) => l(variables));
  };

  private async getVariables(): Promise<MessageBlob> {
    const zendesk = await this.messageRouter?.sendCommand(
      'pageScript',
      'zendeskGetActive'
    );
    if (!zendesk) {
      return {};
    }
    const activeVariables: { [key: string]: string } = {};
    const { ticket, currentUser } = zendesk;
    if (ticket && ticket.requester) {
      activeVariables.recipientName = ticket.requester.name;
      activeVariables.recipientFirstName = ticket.requester.name.split(' ')[0];
      activeVariables.recipientEmail = ticket.requester.email;
      activeVariables.recipientDomain =
        activeVariables.recipientEmail?.split('@')[1];
    }
    if (currentUser) {
      let authorName = currentUser.alias;
      if (!authorName || authorName === '') {
        authorName = currentUser.name;
      }
      if (authorName && authorName !== '') {
        activeVariables.authorName = authorName;
        activeVariables.authorFirstName = authorName.split(' ')[0];
      }
    }
    return activeVariables;
  }
}
