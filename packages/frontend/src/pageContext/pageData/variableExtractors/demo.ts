import {
  CONVO_EMAIL,
  CONVO_NAME_FIRST,
  CONVO_NAME_FULL,
} from '../../../demo/constants';
import { Context, Extractor, VariableListener } from '.';

export default class WalkthroughExtractor implements Extractor {
  private variables: Record<string, any> = {
    recipientName: CONVO_NAME_FULL,
    recipientEmail: CONVO_EMAIL,
    recipientFirstName: CONVO_NAME_FIRST,
  };
  private listeners: VariableListener[] = [];

  // constructor({}: {}) {}

  initialize() {}

  // URL change
  setContext(_context: Context) {}

  addListener(listener: VariableListener) {
    this.listeners.push(listener);
    listener(this.variables);
  }

  getPossibleVariables() {
    return [
      { id: 'recipientEmail', placeholder: 'Recipient email' },
      { id: 'recipientName', placeholder: 'Recipient name' },
      { id: 'recipientFirstName', placeholder: 'Recipient first name' },
    ];
  }
}
