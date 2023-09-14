import * as Sentry from '@sentry/browser';

import { Commands, getTopology } from '@kenchi/commands';
import MessageRouter, {
  ExtensionNodeConfig,
  WindowNodeConfig,
} from '@michaelschade/kenchi-message-router';

import { setupFetchPlaybackListeners } from './fetchPlayback';
import setupInstallListeners from './install';
import {
  getRecordingSettings,
  isRecording,
  setupRecordListeners,
} from './record';
import setupSessionListeners from './session';
import {
  isMissingReceiverError,
  isPortClosedError,
  shouldCompletelyIgnoreUrl,
} from './utils';

if (process.env.APP_ENV !== 'development') {
  Sentry.init({
    dsn: 'https://9a848a9508d74f38b1e52dab2b9a7392@sentry.io/2047652',
    release: process.env.SENTRY_VERSION,
    environment: process.env.APP_ENV,
  });
}

type State = { iframe: HTMLIFrameElement };
const state: State = { iframe: document.createElement('iframe') };

const version = chrome.runtime.getManifest().version;
state.iframe.src = `${process.env.APP_HOST}/background.html?version=${version}`;
document.body.appendChild(state.iframe);

const router = new MessageRouter<Commands, 'background'>(
  {
    background: [
      new ExtensionNodeConfig(process.env.EXTENSION_ID, 'background'),
      new WindowNodeConfig(window.location.origin, window),
    ],
    hostedBackground: new WindowNodeConfig(
      process.env.APP_HOST,
      state.iframe.contentWindow ?? undefined
    ),
    contentScript: new ExtensionNodeConfig(process.env.EXTENSION_ID, 'tab'),
    iframe: new ExtensionNodeConfig(process.env.EXTENSION_ID, 'frame'),
    hud: new ExtensionNodeConfig(process.env.EXTENSION_ID, 'external'),
    dashboard: new ExtensionNodeConfig(process.env.EXTENSION_ID, 'external'),
  },
  getTopology(process.env.APP_HOST, process.env.EXTENSION_ID),
  'background'
);

router.addCommandHandler('dashboard', 'checkInstallStatus', ({ sender }) => {
  const tabId = sender?.tab?.id;
  if (!tabId) {
    throw new Error('missingTab');
  }

  return new Promise((resolve) =>
    chrome.commands.getAll((commands) => {
      const version = chrome.runtime.getManifest().version;
      resolve({
        tabId,
        installed: true,
        version,
        commands,
      });
    })
  );
});

router.addCommandHandler(
  'dashboard',
  'sendToShortcutsPage',
  () =>
    new Promise<void>((resolve) =>
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }, () => {
        resolve();
      })
    )
);

router.addCommandHandler('contentScript', 'ping', async ({ sender }) => {
  const tab = sender?.tab;
  if (!tab?.id || !tab?.url) {
    throw new Error('missingTab');
  }

  let settings: Commands['background']['ping']['resp']['settings'] = undefined;

  const recordingSettings = getRecordingSettings(tab);
  if (recordingSettings) {
    settings = { pageType: 'recording', ...recordingSettings };
  } else if (tab.url) {
    const resp = await router.sendCommand(
      'hostedBackground',
      'getDomainSettings',
      { url: tab.url }
    );
    settings = { pageType: 'content', ...resp.settings };
  }
  return { tabId: tab.id, settings };
});

router.registerListeners();

export const maybeInject = (
  tabId: number,
  { inject, injectGmail }: { inject: boolean; injectGmail: boolean },
  quickly = false
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (inject) {
      if (injectGmail) {
        chrome.tabs.executeScript(
          tabId,
          { file: 'inboxsdk.js', runAt: 'document_end' },
          () => {
            chrome.tabs.executeScript(
              tabId,
              { file: 'contentScript.bundle.js', runAt: 'document_end' },
              () => resolve(true)
            );
          }
        );
      } else {
        chrome.tabs.executeScript(
          tabId,
          {
            file: 'contentScript.bundle.js',
            runAt: quickly ? 'document_start' : 'document_end',
          },
          () => resolve(true)
        );
      }
    } else {
      resolve(false);
    }
  });
};

async function sendCommand(
  destinations: string | string[],
  command: string,
  tab: chrome.tabs.Tab,
  opts?: {
    maybeInjectCommand?: 'newTogglePressed' | 'pageLoaded';
    retryAfterInjection?: (count: number) => boolean;
    forceSidebarInjection?: boolean;
    extraArgs?: Record<string, unknown>;
  }
) {
  if (shouldCompletelyIgnoreUrl(tab.url)) {
    return;
  }
  const tabId = tab.id;
  if (!tabId) {
    throw new Error('missingTab');
  }

  const start = Date.now();
  let mayNeedContentScript = true;
  let needsSidebarInjection = opts?.forceSidebarInjection ?? false;

  const desintationsToRetry = new Set(
    Array.isArray(destinations) ? destinations : [destinations]
  );

  const send = async () => {
    try {
      if (needsSidebarInjection) {
        await router.sendCommand(
          'contentScript',
          'ensureSidebarInjected',
          undefined,
          { tabId }
        );
        mayNeedContentScript = false;
        needsSidebarInjection = false;
      }
    } catch (error) {
      if (!isMissingReceiverError(error) && !isPortClosedError(error)) {
        throw error;
      }
      return;
    }

    const promises = Array.from(desintationsToRetry).map(async (d) => {
      try {
        await router.sendCommand(
          d,
          command,
          {
            ...opts?.extraArgs,
            url: tab.url,
            start,
          },
          { tabId }
        );
        desintationsToRetry.delete(d);
      } catch (error) {
        if (!isMissingReceiverError(error) && !isPortClosedError(error)) {
          throw error;
        }
      }
    });
    await Promise.all(promises);
  };

  await send();

  if (desintationsToRetry.size === 0) {
    return;
  }

  const backgroundCommand = opts?.maybeInjectCommand;
  if (!backgroundCommand) {
    return;
  }
  if (!tab.url) {
    throw new Error('missingTab');
  }

  if (mayNeedContentScript) {
    let resp;
    if (isRecording(tab)) {
      resp = { inject: true, injectGmail: false };
    } else {
      resp = await router.sendCommand('hostedBackground', backgroundCommand, {
        url: tab.url,
      });
    }
    const injected = await maybeInject(tabId, resp);
    if (!injected) {
      // If we need the content script to do anything, but the hosted
      // background says we're not supposed to inject it, there's nothing to
      // do.
      return;
    }
    mayNeedContentScript = false;
  }

  // We can't use waitForReady here because we rely on the command
  // failing to identify that we need to inject it.
  let count = 0;
  const retry = async () => {
    count++;
    await send();
    if (desintationsToRetry.size > 0 && opts?.retryAfterInjection?.(count)) {
      window.setTimeout(retry, 10);
    }
  };
  retry();
}

const retryWithLogging = (command: string) => (count: number) => {
  if (count < 10) {
    return true;
  } else {
    Sentry.captureMessage(`Failed to resend ${command}`);
    return false;
  }
};

chrome.browserAction.onClicked.addListener((tab) =>
  sendCommand('app', 'togglePressed', tab, {
    forceSidebarInjection: true,
    maybeInjectCommand: 'newTogglePressed',
    retryAfterInjection: retryWithLogging('togglePressed'),
  })
);

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabArray) => {
    const tab = tabArray[0];
    if (!tab) {
      console.error('No active tab from command');
      return;
    }

    if (shouldCompletelyIgnoreUrl(tab.url)) {
      return;
    }

    if (command === 'activate') {
      sendCommand('app', 'activatePressed', tab, {
        forceSidebarInjection: true,
        maybeInjectCommand: 'newTogglePressed',
        retryAfterInjection: retryWithLogging('activatePressed'),
      });
    } else if (command === 'hide') {
      sendCommand('app', 'hidePressed', tab);
    } else {
      console.error('Received unexpected command:', command);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changedProps, tab) => {
  if (shouldCompletelyIgnoreUrl(tab.url)) {
    chrome.browserAction.setIcon({
      path: '/images/icon-inactive-32.png',
      tabId,
    });
    return;
  } else {
    chrome.browserAction.setIcon({
      path: '/images/icon-32.png',
      tabId,
    });
  }

  if (tab.status !== 'complete' || !tab.url) {
    return;
  }

  if (!changedProps.status && !changedProps.url) {
    return;
  }

  // If app is already loaded this is probably a single page app, just track the change.
  sendCommand(['app', 'hud'], 'urlChanged', tab, {
    maybeInjectCommand: 'pageLoaded',
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab && info.menuItemId === 'saveToKenchi') {
    sendCommand('contentScript', 'proposeNewSnippet', tab, {
      maybeInjectCommand: 'newTogglePressed',
      retryAfterInjection: retryWithLogging('saveToKenchi'),
      extraArgs: { text: info.selectionText },
    });
  }
});

setupInstallListeners();
setupSessionListeners(router);
setupRecordListeners(router);
setupFetchPlaybackListeners(router);
