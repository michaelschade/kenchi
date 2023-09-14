import { captureMessage } from '@sentry/browser';
import { confetti } from 'dom-confetti';
import { stringify } from 'qs';

import { Commands, KenchiMessageRouter } from '@kenchi/commands';

import {
  applyStyles,
  captureSelection,
  injectScript,
  injectStylesheet,
  shouldTriggerHudInjection,
} from '../utils';
import HostInterface from './hostInterfaces';
import DefaultHostInterface from './hostInterfaces/default';
import GmailHostInterface from './hostInterfaces/gmail';
import { initMessageRouter } from './messageRouter';
import Recorder from './recorder';
import { initSentry } from './sentry';

const CLASS_NAME_PREFIX = 'kenchi-';
const SIDEBAR_ID = 'kenchi-iframe';

class ContentScript {
  private executingInterfaceCommand = false;
  private interface: HostInterface | null = null;
  private lastFocus: HTMLElement | null = null;
  private refocusContentEditable: (() => Promise<void>) | null = null;
  private iframeStyle: HTMLStyleElement | null = null;
  private alwaysInjectSidebarCallbacks: (() => void)[] = [];
  private tabId = 0;
  private recorder: Recorder | null = null;

  private getUrlParams() {
    return stringify({
      tab: this.tabId,
      version: chrome.runtime.getManifest().version,
      initialUrl: window.location.toString(),
    });
  }

  private async initSidebar() {
    if (!this.interface) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'kenchi-iframe';
    iframe.allow = 'clipboard-write';
    iframe.src = chrome.runtime.getURL(`iframe.html?${this.getUrlParams()}`);
    await this.interface.init(iframe);

    this.alwaysInjectSidebarCallbacks.forEach((cb) => cb());
    this.alwaysInjectSidebarCallbacks = [];
  }

  private initListeners() {
    // Record the last focus when we're about to lose it to something else (namely Kenchi)
    document.addEventListener(
      'focusin',
      () => {
        if (this.executingInterfaceCommand) {
          return;
        }
        this.lastFocus = document.activeElement as HTMLElement;
      },
      true
    );

    document.addEventListener(
      'selectionchange',
      (e) => {
        if (this.executingInterfaceCommand) {
          return;
        }
        const selection = window.getSelection();
        // Don't clear selection if we focus off-window (e.g. into Kenchi), but do
        // clear it if we change selection on-page, e.g. click outside a
        // contenteditable
        if (selection?.anchorNode) {
          this.refocusContentEditable = captureSelection(true);
        }
      },
      true
    );
  }

  private async ensureSidebarInjected() {
    if (this.interface) {
      await this.initSidebar();
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    } else {
      return new Promise<void>((resolve) => {
        // To solve the race condition where this is called before the `ping` is responded to
        this.alwaysInjectSidebarCallbacks.push(resolve);
      });
    }
  }

  private registerCommands(router: KenchiMessageRouter<'contentScript'>) {
    router.addCommandHandler('background', 'ensureSidebarInjected', () =>
      this.ensureSidebarInjected()
    );

    router.addCommandHandler(
      ['pageScript', 'background'],
      'proposeNewSnippet',
      async ({ text, html }: { text?: string; html?: string }) => {
        if (!!this.recorder) {
          return;
        }
        if (!html) {
          const fragment = window.getSelection()?.getRangeAt(0).cloneContents();
          if (fragment) {
            // Make absolute URLs
            const images = fragment.querySelectorAll<HTMLImageElement>('img');
            images.forEach((i) => {
              // Drop of cleanup
              const { height, width } = i.getBoundingClientRect();
              if (height < 10 || width < 10) {
                i.remove();
              }
              // eslint-disable-next-line no-self-assign
              i.src = i.src;
            });
            const links = fragment.querySelectorAll<HTMLAnchorElement>('a');
            // eslint-disable-next-line no-self-assign
            links.forEach((a) => (a.href = a.href));

            html = new XMLSerializer().serializeToString(fragment);
          }
        }
        await this.ensureSidebarInjected();
        return router.sendCommand('app', 'proposeNewSnippet', { text, html });
      }
    );

    router.addCommandHandler(
      ['app', 'hud'],
      'insertText',
      async ({ data, path, useSelection = true }) => {
        if (!this.interface) {
          return { success: false };
        }
        this.executingInterfaceCommand = true;
        const success = await this.interface.insertText(
          data,
          this.lastFocus,
          this.refocusContentEditable,
          path,
          useSelection
        );
        this.executingInterfaceCommand = false;
        return { success };
      }
    );

    const injectedScripts = new Set();
    router.addCommandHandler(['app', 'hud'], 'injectScript', ({ name }) => {
      if (injectedScripts.has(name)) {
        return Promise.reject({ error: 'alreadyInjected' });
      }
      injectScript(name);
      injectedScripts.add(name);
      return Promise.resolve();
    });

    router.addCommandHandler(
      'pageScript',
      'report',
      async ({
        message,
        extra,
      }: {
        message: string;
        extra?: Record<string, unknown>;
      }) => {
        captureMessage(`pageScript: ${message}`, { extra });
      }
    );

    router.addCommandHandler('app', 'close', () => {
      // .focus() silently fails if the element is not focusable (which is
      // non-trivial to determine), so focus on window first so if it fails we
      // don't remain on the iframe.
      window.focus();
      if (this.lastFocus) {
        this.lastFocus.focus();
      }
      if (!this.interface) {
        return Promise.reject();
      }
      return this.interface.close();
    });

    router.addCommandHandler('app', 'open', () => {
      if (!this.interface) {
        return Promise.reject();
      }
      return this.interface.open();
    });

    const updateKenchiClasses = (
      classList: DOMTokenList,
      classNames: string[]
    ) => {
      if (classNames.some((c) => !c.startsWith(CLASS_NAME_PREFIX))) {
        throw new Error(`All class names must start with ${CLASS_NAME_PREFIX}`);
      }
      const toAdd = classNames.filter((c) => !classList.contains(c));
      const toRemove = [...classList].filter(
        (c) => c.startsWith(CLASS_NAME_PREFIX) && !classNames.includes(c)
      );
      toAdd.forEach((c) => classList.add(c));
      toRemove.forEach((c) => classList.remove(c));
    };

    router.addCommandHandler(
      'app',
      'applyStyles',
      async ({ setBodyClasses, setIframeClasses, setStyle }) => {
        if (setBodyClasses) {
          updateKenchiClasses(document.body.classList, setBodyClasses);
        }
        if (setIframeClasses) {
          const iframe = document.getElementById(SIDEBAR_ID);
          if (iframe) {
            updateKenchiClasses(iframe.classList, setIframeClasses);
          }
        }
        if (setStyle && this.iframeStyle) {
          this.iframeStyle.textContent = setStyle;
        }
      }
    );

    router.addCommandHandler('app', 'confetti', async () => {
      const div = document.createElement('div');
      applyStyles(div, {
        position: 'fixed',
        bottom: 0,
        left: '50%',
      });
      document.body.appendChild(div);
      confetti(div, {
        angle: 90,
        spread: 130,
        startVelocity: 70,
        elementCount: 160,
        dragFriction: 0.1,
        duration: 5000,
        stagger: 0,
        width: '10px',
        height: '5px',
        colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'],
      });
      window.setTimeout(() => document.body.removeChild(div), 5500);
    });
  }

  async init() {
    initSentry();
    this.initListeners();
    const [router, { onTabId, onHudWindow }] = initMessageRouter();

    this.registerCommands(router);
    router.registerListeners();

    const pingResp = await router.sendCommand('background', 'ping', {});

    if (!pingResp?.settings) {
      captureMessage('No settings back from ping');
      return;
    }
    const { tabId, settings } = pingResp;

    onTabId(tabId);
    this.tabId = tabId;

    this.iframeStyle = injectStylesheet(settings.initialStyle);
    switch (settings.pageType) {
      case 'recording':
        new Recorder(router, settings.isPaused);
        break;
      case 'content':
        this.initContent(router, settings, onHudWindow);
        break;
    }
  }

  private initContent(
    router: KenchiMessageRouter<'contentScript'>,
    settings: Extract<
      Commands['background']['ping']['resp']['settings'],
      { pageType: 'content' }
    >,
    onHudWindow: (window: Window) => void
  ) {
    if (settings.isGmail) {
      this.interface = new GmailHostInterface(router);
      this.initSidebar();
    } else {
      this.interface = new DefaultHostInterface(router);
      if (
        settings.injectSidebar ||
        this.alwaysInjectSidebarCallbacks.length > 0
      ) {
        this.initSidebar();
      }
    }

    if (settings.injectHud) {
      const injectHud = () => {
        const hudIframe = document.createElement('iframe');
        hudIframe.allow = 'clipboard-write';
        hudIframe.src = `${
          process.env.APP_HOST
        }/hud.html?${this.getUrlParams()}`;
        const hudElem = document.createElement('div');
        hudElem.style.display = 'none';
        hudElem.id = 'kenchi-hud';
        hudElem.appendChild(hudIframe);
        document.body.appendChild(hudElem);
        // We need to let the iframe start loading before we can set the window, thus the setTimeout.
        window.setTimeout(() => {
          onHudWindow(hudIframe.contentWindow!);
        }, 0);
      };
      if (
        settings.injectHud !== 'deferred' ||
        shouldTriggerHudInjection(document.activeElement)
      ) {
        injectHud();
      } else {
        const maybeInjectHud = (e: FocusEvent) => {
          if (shouldTriggerHudInjection(e.target)) {
            injectHud();
            window.removeEventListener('focusin', maybeInjectHud);
          }
        };
        window.addEventListener('focusin', maybeInjectHud);
      }
    }
  }
}

if (window.hasContentScript) {
  console.log('Attempt to double-inject contentScript, ignoring');
} else {
  window.hasContentScript = true;
  const contentScript = new ContentScript();
  contentScript.init();
}
