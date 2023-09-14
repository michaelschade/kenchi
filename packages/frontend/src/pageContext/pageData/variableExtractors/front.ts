import { captureMessage } from '@sentry/react';
import isEqual from 'fast-deep-equal';
import { assign, isArray } from 'lodash';

import { KenchiMessageRouter } from '@kenchi/commands';
import { MessageBlob } from '@michaelschade/kenchi-message-router';

import { isMessageRouterErrorType } from '../../../utils';
import { Context, Extractor, VariableListener } from '.';

type FrontRecord = { type: 'teammate' | 'conversation'; data: any };
type FrontMessageBlob = {
  type: 'data:recordsUpdated';
  records: FrontRecord[];
} & MessageBlob;
const isFrontMessageBlob = (blob: MessageBlob): blob is FrontMessageBlob =>
  !!(
    blob.type === 'data:recordsUpdated' &&
    blob.records &&
    isArray(blob.records) &&
    blob.records.every(isFrontRecord)
  );

const isFrontRecord = (record: any): record is FrontRecord =>
  !!(
    (record.type === 'teammate' || record.type === 'conversation') &&
    record.data
  );

export default class FrontExtractor implements Extractor {
  messageRouter?: KenchiMessageRouter<'app' | 'hud'>;
  private listeners: VariableListener[] = [];
  lastVariables: MessageBlob | null = null;
  initialize(messageRouter: KenchiMessageRouter<'app' | 'hud'>) {
    this.messageRouter = messageRouter;
    messageRouter
      .sendCommand('contentScript', 'injectScript', {
        name: 'front',
      })
      .catch((error) => {
        if (isMessageRouterErrorType(error, 'alreadyInjected')) {
          console.log('Already injected, continuing');
        } else {
          throw error;
        }
      });
    messageRouter.addCommandHandler(
      'pageScript',
      'frontCommand',
      async (blob: MessageBlob) => {
        if (isFrontMessageBlob(blob)) {
          this.handleMessage(blob);
        } else {
          captureMessage('Unsupported message type for Front', {
            extra: blob,
          });
        }
      }
    );
    messageRouter.sendCommand('pageScript', 'frontInit');
  }

  setContext(context: Context) {}
  addListener(listener: VariableListener) {
    this.listeners.push(listener);
  }
  private handleMessage(message: FrontMessageBlob) {
    switch (message.type) {
      case 'data:recordsUpdated':
        this.extractVariables(message.records);
        const variables = {
          ...this.lastVariables,
          ...this.extractVariables(message.records),
        };
        if (!isEqual(variables, this.lastVariables)) {
          this.lastVariables = variables;
          this.listeners.forEach((l) => l(variables ?? {}));
        }
    }
  }
  private extractVariables(records: FrontRecord[]) {
    return assign(
      {},
      ...records.map((record) => {
        const { type, data } = record;
        switch (type) {
          case 'teammate':
            return this.extractAuthor(data);
          case 'conversation':
            return this.extractRecipient(data.recipient);
        }
        // Unreachable but required by the linter because we need to guarantee a return value
        return {};
      })
    );
  }

  private extractAuthor(data: any) {
    const { email, givenName, familyName } = data;
    if (
      typeof email !== 'string' ||
      typeof givenName !== 'string' ||
      typeof familyName !== 'string'
    ) {
      captureMessage('Invalid author data from Front', {
        extra: { authorData: data },
      });
      return {};
    }
    return {
      authorEmail: email,
      authorDomain: email.split('@')[1],
      authorName: `${givenName} ${familyName}`,
      authorFirstName: givenName,
    };
  }

  private extractRecipient(recipient: any) {
    if (!recipient) {
      return {};
    }

    const { handle: email, name } = recipient;
    if (typeof email !== 'string' || typeof name !== 'string') {
      captureMessage('Invalid recipient data from Front', {
        extra: { recipientData: recipient },
      });
      return {};
    }

    return {
      recipientEmail: email,
      recipientDomain: email.split('@')[1],
      recipientName: name,
      recipientFirstName: name.split(' ')[0],
    };
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
}
