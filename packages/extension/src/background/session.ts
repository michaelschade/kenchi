import { Commands, KenchiMessageRouter } from '@kenchi/commands';

import { shouldCompletelyIgnoreUrl } from './utils';

type SessionEntry = Commands['hostedBackground']['sessionEntry']['args'];

export default function setupSessionListeners(
  router: KenchiMessageRouter<'background'>
) {
  const sendSessionEntry = (
    action: SessionEntry['action'],
    windowId?: number,
    tabId?: number,
    data?: Record<string, any>
  ) => {
    router.sendCommand('hostedBackground', 'sessionEntry', {
      timestamp: new Date().getTime(),
      action,
      windowId,
      tabId,
      data: data || {},
    });
  };

  chrome.runtime.onStartup.addListener(() => sendSessionEntry('startup'));
  chrome.tabs.onCreated.addListener((tab) =>
    sendSessionEntry('tabCreate', tab.windowId, tab.id, {
      opener: tab.openerTabId,
    })
  );
  chrome.tabs.onRemoved.addListener((tabId, { windowId }) =>
    sendSessionEntry('tabClose', windowId, tabId)
  );
  chrome.tabs.onAttached.addListener((tabId, { newWindowId }) =>
    sendSessionEntry('tabWindowMove', newWindowId, tabId)
  );
  chrome.tabs.onActivated.addListener(({ tabId, windowId }) =>
    sendSessionEntry('tabActivate', windowId, tabId)
  );
  chrome.windows.onFocusChanged.addListener((windowId) =>
    sendSessionEntry('windowFocus', windowId)
  );
  chrome.windows.onRemoved.addListener((windowId) =>
    sendSessionEntry('windowClose', windowId)
  );

  chrome.tabs.onUpdated.addListener((tabId, changedProps, tab) => {
    if (tab.status !== 'complete' || !tab.url) {
      return;
    }

    if (!changedProps.status && !changedProps.url) {
      return;
    }

    if (shouldCompletelyIgnoreUrl(tab.url)) {
      return;
    }

    sendSessionEntry('urlChange', tab.windowId, tabId, {
      url: tab.url,
      active: tab.active,
    });
  });
}
