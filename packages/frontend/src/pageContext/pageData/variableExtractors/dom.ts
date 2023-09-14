import { KenchiMessageRouter } from '@kenchi/commands';
import { MessageBlob } from '@michaelschade/kenchi-message-router';

import { isMessageRouterErrorType } from '../../../utils';
import { parseXPath } from '../../../utils/xpath';
import { Context, Extractor, Variable, VariableListener } from '.';

type DOMVariable = Variable & {
  xpath: string;
  resultType: 'number' | 'string' | 'boolean';
};

export default class DOMExtractor implements Extractor {
  private variables: Record<string, any> = {};
  private listeners: VariableListener[] = [];

  private variableConfigs: Record<string, DOMVariable>;

  constructor({ variables = [] }: { variables?: DOMVariable[] }) {
    this.variableConfigs = {};
    variables.forEach((v) => (this.variableConfigs[v.id] = v));
  }

  initialize(messageRouter: KenchiMessageRouter<'app'>) {
    const setup = async () => {
      try {
        await messageRouter.sendCommand('contentScript', 'injectScript', {
          name: 'domReader',
        });
      } catch (error) {
        // We probably hot reloaded in dev. Clear/reset state
        if (isMessageRouterErrorType(error, 'alreadyInjected')) {
          await messageRouter.sendCommand('pageScript', 'domReaderClear');
        } else {
          throw error;
        }
      }
      Object.values(this.variableConfigs).forEach((config) => {
        messageRouter.sendCommand('pageScript', 'domReaderListen', {
          ...config,
          xpath: parseXPath(config.xpath),
        });
      });
    };
    setup(); // Can be setup async
    messageRouter.addCommandHandler(
      'pageScript',
      'domReaderUpdate',
      this.handleMessage
    );
    return () =>
      messageRouter.removeCommandHandler(
        'pageScript',
        'domReaderUpdate',
        this.handleMessage
      );
  }

  // URL change
  setContext(_context: Context) {}

  addListener(listener: VariableListener) {
    this.listeners.push(listener);
    listener(this.variables);
  }

  getPossibleVariables() {
    return Object.values(this.variableConfigs).map(({ id, placeholder }) => ({
      id,
      placeholder,
    }));
  }

  handleMessage = (message: MessageBlob) => {
    const variables: Record<string, any> = {};
    Object.entries(message).forEach(([id, value]) => {
      if (!(id in this.variableConfigs)) {
        console.log('Unexpected variable');
        return;
      }
      variables[id] = value;
    });
    this.variables = variables;
    this.listeners.forEach((l) => l(this.variables));

    return Promise.resolve();
  };
}
