import isEqual from 'fast-deep-equal';

import { KenchiMessageRouter } from '@kenchi/commands';
import { MessageBlob } from '@michaelschade/kenchi-message-router';

import {
  defaultActions,
  intercomActions,
  zendeskActions,
} from '../actions/actionRunners';
import {
  OptionalIfEmpty,
  PageActionMap,
  PageActionRunnerResponse,
  PageActions,
  PageActionType,
} from '../actions/types';
import { DomainSettings } from '../domainSettings/DomainSettingsController';
import { DefaultFormatter } from './formatters/DefaultFormatter';
import FormatterInterface from './formatters/FormatterInterface';
import GmailFormatter from './formatters/GmailFormatter';
import IntercomFormatter from './formatters/IntercomFormatter';
import ZendeskFormatter from './formatters/ZendeskFormatter';
import { Extractor, getVariableExtractors } from './variableExtractors';

type VariablesCallback = (variables: MessageBlob) => void;

const GMAIL_HOST = 'mail.google.com';
const FRONT_HOST = 'app.frontapp.com';

// TODO: This isn't quite the right interface, but I need a start point to keep
// this refactor from blowing up into an even larger change. This may even be
// multiple interfaces, one for retrieving data from the page and the other for
// performing actions
export interface PageData {
  addListener(callback: VariablesCallback): void;
  removeListener(callback: VariablesCallback): void;
  getFormatter(): FormatterInterface;
  runAction<TType extends PageActionType>(
    type: TType,
    ...args: OptionalIfEmpty<PageActions[TType]['args']>
  ): PageActionRunnerResponse<TType>;
  supportedActions(): PageActionType[];
  // There is a pattern emerging where Actions need more specialized data from
  // the page, e.g. getting tag data from Intercom to apply tags. But
  // getExtractor() might not be the interface we want long term. Once we have a
  // better understanding of our needs for page specific data, we can refactor.
  getExtractor(name: string): Extractor | null;
  // This should probably be hidden away as a page-specific behavior and instead
  // have a more generic insertText() method
  prepareForTextInsertion(): Promise<void>;
}

export default class PageDataController implements PageData {
  private url: URL | null = null;

  private callbacks: VariablesCallback[] = [];

  private domainSettings: DomainSettings | null = null;

  private extractors: Record<string, Extractor> | null = null;
  private uninitializeExtractors: (() => void)[] = [];

  // By extractor name
  private currentVariables: Record<string, MessageBlob> = {};

  constructor(private messageRouter: KenchiMessageRouter<'app' | 'hud'>) {}

  setPageUrl(url: URL) {
    this.url = url;
    if (this.extractors) {
      Object.values(this.extractors).forEach((e) => e.setContext({ url }));
    }
  }

  private extractorVariablesUpdated(name: string, variables: MessageBlob) {
    if (isEqual(this.currentVariables[name], variables)) {
      return;
    }
    this.currentVariables[name] = variables;
    const mergedVariables = Object.assign(
      {},
      ...Object.values(this.currentVariables)
    );
    this.callbacks.forEach((c) => c(mergedVariables));
  }

  register() {
    // Nothing to register, only unregister
    return () => {
      // This "uninitialize when hot reloading" thing mostly works, but
      // sometimes it removes something that wasn't registered. Unclear why.
      this.uninitializeExtractors.forEach((c) => c());
      this.uninitializeExtractors = [];
    };
  }

  addListener(callback: VariablesCallback): void {
    if (this.currentVariables) {
      const mergedVariables = Object.assign(
        {},
        ...Object.values(this.currentVariables)
      );
      callback(mergedVariables);
    }
    this.callbacks.push(callback);
  }

  removeListener(callback: VariablesCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index === -1) {
      throw new Error('Removing variable listener that does not exist');
    }
    this.callbacks.splice(index, 1);
  }

  // This should really not exist, GmailAction should tie into
  // DomainSettingsController to get the settings it needs. But being lazy for
  // now...
  getDomainSettings() {
    return this.domainSettings;
  }

  onDomainSettingsUpdate(domainSettings: DomainSettings) {
    const previousSettings = this.domainSettings;
    this.domainSettings = domainSettings;
    if (!previousSettings) {
      this.extractors = getVariableExtractors(
        domainSettings.variableExtractors
      );
      const url = this.url;
      if (!url) {
        throw new Error('Domain settings cannot be set before url');
      }
      Object.entries(this.extractors).forEach(([name, e]) => {
        const uninitialize = e.initialize(this.messageRouter);
        if (uninitialize) {
          this.uninitializeExtractors.push(uninitialize);
        }
        e.addListener((variables) =>
          this.extractorVariablesUpdated(name, variables)
        );
        e.setContext({ url });
      });
    }
  }

  getExtractor(name: string): Extractor | null {
    return this.extractors && this.extractors[name];
  }

  getFormatter(): FormatterInterface {
    const host = this.url?.host;
    if (host === GMAIL_HOST || host === FRONT_HOST) {
      return new GmailFormatter();
    } else if (host?.endsWith('.zendesk.com')) {
      return new ZendeskFormatter();
    } else if (host === 'app.intercom.com') {
      return new IntercomFormatter();
    } else {
      return new DefaultFormatter();
    }
  }

  async prepareForTextInsertion(): Promise<void> {
    const host = this.url?.host;
    if (host === FRONT_HOST) {
      return this.messageRouter.sendCommand(
        'pageScript',
        'prepareForInsertion'
      );
    }
  }

  supportedActions() {
    return Object.keys(this.getActionRunners()) as PageActionType[];
  }

  async runAction<TType extends PageActionType>(
    type: TType,
    ...[args]: OptionalIfEmpty<PageActions[TType]['args']>
  ): PageActionRunnerResponse<TType> {
    const runner = this.getActionRunners()[type];
    if (!runner) {
      throw new Error(`No runner available for action: ${type}`);
    }
    return runner(
      {
        messageRouter: this.messageRouter,
        pageDataController: this,
        domainSettings: this.domainSettings,
      },
      args as any
    );
  }

  private getActionRunners(): PageActionMap {
    const host = this.url?.host;
    if (host === 'app.intercom.com') {
      return {
        ...defaultActions,
        ...intercomActions,
      };
    } else if (host?.endsWith('.zendesk.com')) {
      return {
        ...defaultActions,
        ...zendeskActions,
      };
    } else {
      return defaultActions;
    }
  }
}
