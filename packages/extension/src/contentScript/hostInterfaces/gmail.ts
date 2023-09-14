import isEqual from 'fast-deep-equal';

import { Commands as AllCommands, KenchiMessageRouter } from '@kenchi/commands';
import { MessageBlob } from '@michaelschade/kenchi-message-router';

import { captureSelection, focusElem, insertTextViaPaste } from '../../utils';
import HostInterface from '.';

type ComposeViewHandler = (view: InboxSDK.Compose.ComposeView) => void;

type Commands = AllCommands['contentScript'];

const mouseEvent = (type: 'mouseup' | 'mousedown') => {
  const event = document.createEvent('MouseEvents');
  event.initMouseEvent(
    type,
    true,
    true,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  return event;
};

export default class GmailHostInterface implements HostInterface {
  private destinations = new Set<string>();
  private initialized = false;
  private initializing = false;
  private counter = 0;
  private sdk: InboxSDK.InboxSDKInstance | null = null;
  private globalSidebar: InboxSDK.Conversations.ContentPanelView | null = null;
  private lastVariables: MessageBlob = {};
  private activeThreadViews: {
    [i: number]: {
      view: InboxSDK.Conversations.ThreadView;
      lastActive: number;
    };
  } = {};
  private activeComposeViews: {
    [i: number]: {
      view: InboxSDK.Compose.ComposeView;
      minimized: boolean;
      lastActive: number;
    };
  } = {};
  private composeViewHandlers: ComposeViewHandler[] = [];

  constructor(private messageRouter: KenchiMessageRouter<'contentScript'>) {}

  async init(sidebarEl: HTMLIFrameElement) {
    if (this.initializing || this.initialized) {
      return true;
    }
    this.initializing = true;

    if (!window.InboxSDK) {
      throw new Error('missingInboxSDK');
    }

    const sdk = await window.InboxSDK.load(2, 'sdk_kenchi_412c46547a');
    this.sdk = sdk;
    this.registerHandlers();
    this.registerListeners(sdk);
    this.globalSidebar = await this.sdk.Global.addSidebarContentPanel({
      el: sidebarEl,
      title: 'Kenchi',
      iconUrl: chrome.runtime.getURL('images/icon-40.png'),
      hideTitleBar: true,
    });

    this.sdk.Compose.registerComposeViewHandler((composeView) => {
      composeView.addButton({
        title: 'Save as Kenchi snippet',
        iconUrl: chrome.runtime.getURL('images/icon-40.png'),
        onClick: () => {
          const selectedBodyHTML = composeView.getSelectedBodyHTML();
          const html = selectedBodyHTML || composeView.getHTMLContent();
          this.messageRouter.sendCommand('app', 'proposeNewSnippet', {
            html,
          });
        },
      });
    });

    // We need time for the app to load before we start sending state, give it
    // 4s because gmail takes forever to load anyway.
    window.setTimeout(() => {
      this.initialized = true;
      this.maybeUpdateVariables();
    }, 4000);
    return true;
  }

  private registerHandlers() {
    this.messageRouter.addCommandHandler(
      ['app', 'hud'],
      'gmail:requestVariables',
      async ({}, _command, origin) => {
        this.destinations.add(origin);
        this.sendVariables(origin);
      }
    );

    this.messageRouter.addCommandHandler(
      ['app', 'hud'],
      'gmail:setSubject',
      async (args) => this.setSubject(args)
    );

    this.messageRouter.addCommandHandler(
      ['app', 'hud'],
      'gmail:setRecipients',
      async (args) => this.setRecipients(args)
    );

    this.messageRouter.addCommandHandler(
      ['app', 'hud'],
      'gmail:addLabel',
      async ({ label }) => this.addLabel(label)
    );
  }

  private async setSubject({
    subject,
    onlyCompose,
  }: Commands['gmail:setSubject']['args']) {
    const view = this.getActiveComposeView();
    if (!view) {
      return { success: false };
    }
    if (onlyCompose && (view.isReply() || view.isForward())) {
      return { success: null };
    }
    view.setSubject(subject);
    return { success: true };
  }

  private async setRecipients({
    to,
    cc,
    bcc,
  }: Commands['gmail:setRecipients']['args']) {
    const view = this.getActiveComposeView();
    if (!view) {
      return { success: false };
    }
    if (to) {
      view.setToRecipients(to);
    }
    if (cc) {
      view.setCcRecipients(cc);
    }
    if (bcc) {
      view.setBccRecipients(bcc);
    }
    return { success: true };
  }

  private async addLabel(label: string) {
    const composeView = this.getActiveComposeView();
    const threadView = this.getActiveMessageView()?.getThreadView();
    if (!composeView || !threadView) {
      return { success: false };
    }
    const threadId = await threadView.getThreadIDAsync();
    if (composeView.getThreadID() !== threadId) {
      return { success: false };
    }
    const labelsButton = document.querySelector<HTMLDivElement>(
      'div[role=button][title=Labels]'
    );
    if (!labelsButton) {
      return { success: false };
    }
    labelsButton.dispatchEvent(new MouseEvent('mousedown'));
    const menus = document.querySelectorAll<HTMLDivElement>('div[role=menu]');
    let checkboxes;
    for (let menu of menus) {
      checkboxes = menu.querySelectorAll<HTMLDivElement>(
        'div[role=menuitemcheckbox]'
      );
      if (checkboxes.length > 0) {
        break;
      }
    }
    if (!checkboxes || checkboxes.length === 0) {
      return { success: false };
    }
    checkboxes.forEach((box) => {
      if (
        box.textContent === label &&
        box.getAttribute('aria-checked') !== 'true'
      ) {
        box.dispatchEvent(mouseEvent('mousedown'));
        window.setTimeout(() => box.dispatchEvent(mouseEvent('mouseup')), 100);
      }
    });
    return { success: true };
  }

  private registerListeners(sdk: InboxSDK.InboxSDKInstance) {
    sdk.Conversations.registerThreadViewHandler((threadView) => {
      const index = this.counter++;
      this.activeThreadViews[index] = { view: threadView, lastActive: index };
      threadView.on('destroy', () => {
        delete this.activeThreadViews[index];
      });
      this.maybeUpdateVariables();
    });

    sdk.Compose.registerComposeViewHandler((composeView) => {
      this.composeViewHandlers.forEach((h) => h(composeView));

      const index = this.counter++;
      const viewState = {
        view: composeView,
        minimized: false,
        lastActive: index,
      };
      this.activeComposeViews[index] = viewState;

      const updateActive = () => {
        viewState.lastActive = this.counter++;
        viewState.minimized = false;
        this.maybeUpdateVariables();
      };
      const updateMinimized = () => {
        viewState.minimized = true;
        this.maybeUpdateVariables();
      };

      composeView.on('destroy', () => {
        delete this.activeComposeViews[index];
      });

      composeView.on('bodyChanged', updateActive);
      composeView.on('fromContactChanged', updateActive);
      composeView.on('recipientsChanged', updateActive);
      composeView.on('responseTypeChanged', updateActive);
      composeView.on('restored', updateActive);
      composeView.on('minimized', updateMinimized);
    });
  }

  private maybeUpdateVariables = () => {
    if (!this.initialized) {
      return;
    }
    const variables = this.getActive();
    if (!isEqual(this.lastVariables, variables)) {
      this.lastVariables = variables;
      Array.from(this.destinations).forEach((destination) =>
        this.sendVariables(destination)
      );
    }
  };

  private sendVariables = (destination: string) => {
    this.messageRouter.sendCommand(
      destination,
      'gmail:updateVariables',
      { ...this.lastVariables },
      { confirmReceipt: false }
    );
  };

  private getActiveComposeView = () => {
    // Try to figure out which compose window is active. In an ideal world, we'd
    // check if the thread is active and hit Reply All ourselves. But InboxSDK
    // doesn't do that.
    let latestViewState: {
      lastActive: number;
      view: InboxSDK.Compose.ComposeView | null;
    } = { lastActive: 0, view: null };
    for (var index in this.activeComposeViews) {
      const viewState = this.activeComposeViews[index];
      if (
        !viewState.minimized &&
        viewState.lastActive >= latestViewState.lastActive
      ) {
        latestViewState = viewState;
      }
    }

    return latestViewState.view;
  };

  private getActiveMessageView = () => {
    const userEmail = this.sdk?.User.getEmailAddress();

    // We don't track active thread (since usually there's only ever one), so just pull the first.
    const activeThread = Object.values(this.activeThreadViews)[0];
    if (!activeThread) {
      return null;
    }

    const messageViews = activeThread.view.getMessageViews();
    let lastMessageNotFromMe = messageViews.length - 1;

    while (
      lastMessageNotFromMe >= 0 &&
      messageViews[lastMessageNotFromMe].getSender().emailAddress === userEmail
    ) {
      lastMessageNotFromMe--;
    }
    if (lastMessageNotFromMe < 0) {
      return null;
    }
    return messageViews[lastMessageNotFromMe];
  };

  private getUserContact = (): InboxSDK.Common.Contact => {
    const email = this.sdk!.User.getEmailAddress();
    return {
      emailAddress: email,
      name: email,
    };
  };

  private getActive = () => {
    const view = this.getActiveComposeView();
    const activeVariables: {
      fromContact?: InboxSDK.Common.Contact;
      toRecipients?: InboxSDK.Common.Contact[];
      ccRecipients?: InboxSDK.Common.Contact[];
    } = {};

    if (view) {
      activeVariables.fromContact = view.getFromContact();
      activeVariables.toRecipients = view.getToRecipients();
      activeVariables.ccRecipients = view.getCcRecipients();
    } else {
      const messageView = this.getActiveMessageView();
      if (messageView) {
        activeVariables.fromContact = this.getUserContact();
        activeVariables.toRecipients = [messageView.getSender()];
      }
    }

    return activeVariables;
  };

  private registerComposeViewHandler(handler: ComposeViewHandler) {
    this.composeViewHandlers.push(handler);
  }

  private unregisterComposeViewHandler(handler: ComposeViewHandler) {
    const index = this.composeViewHandlers.findIndex((h) => h === handler);
    if (index !== -1) {
      this.composeViewHandlers.splice(index, 1);
    }
  }

  private clickAndWaitForComposeView(
    button: HTMLSpanElement
  ): Promise<InboxSDK.Compose.ComposeView | null> {
    // There's no unregisterComposeViewHandler, so let's fake it with our existing composeViewHandler.
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        resolve(null);
      }, 2000);
      const nextView = (view: InboxSDK.Compose.ComposeView) => {
        this.unregisterComposeViewHandler(nextView);
        window.clearTimeout(timeout);
        resolve(view);
      };
      this.registerComposeViewHandler(nextView);
      button.click();
    });
  }

  open() {
    this.globalSidebar?.open();
    return Promise.resolve();
  }

  close() {
    this.globalSidebar?.close();
    return Promise.resolve();
  }

  async insertText({ html, text }: { html?: string; text: string }) {
    let view = this.getActiveComposeView();

    if (!view) {
      const threadView = Object.values(this.activeThreadViews)[0]?.view;
      if (threadView) {
        const buttons = [
          ...document.querySelectorAll<HTMLSpanElement>('span[role=link]'),
        ];
        const replyButton =
          buttons.find((n) => n.innerText === 'Reply all') ||
          buttons.find((n) => n.innerText === 'Reply');
        if (replyButton) {
          view = await this.clickAndWaitForComposeView(replyButton);
        } else {
          console.error(
            'Found threadView but could not find Reply button',
            buttons
          );
        }
      }
    }

    if (!view) {
      console.log(
        `insertText failed: no active compose view found (${
          Object.keys(this.activeComposeViews).length
        } total)`
      );
      return false;
    }

    const elem = view.getBodyElement();
    const focusForPaste = captureSelection(true, elem) || focusElem(elem);

    return insertTextViaPaste({ text, html }, focusForPaste);
  }
}
