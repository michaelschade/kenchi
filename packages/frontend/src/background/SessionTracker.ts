import { captureMessage } from '@sentry/react';
import debounce from 'lodash/debounce';

import { Commands } from '@kenchi/commands';

import { randomString, safeURL } from '../utils';
import { MAX_TIMEOUT } from './constants';
import DomainSettings from './DomainSettings';

export const SESSION_DATA_KEY = 'background-session';
const SESSION_DATA_VERSION = 1;
const SESSION_URL = `${process.env.REACT_APP_API_HOST}/s`;

export type RawSessionEntry =
  Commands['hostedBackground']['sessionEntry']['args'];
export type SessionEntry = RawSessionEntry & {
  browserInstanceId: string;
};
type SessionWindow = { activeTab: number; tabs: number[] };
type SessionTab = {
  track: boolean;
  opener?: number;
  softOpener?: number;
  window: number;
};
type SessionData = {
  version: number;
  id: string;
  // Can't JSON encode number keys, need to use strings
  tabs: Record<string, SessionTab>;
  windows: Record<string, SessionWindow>;
  focusedWindow: number;
};

const removeItem = <T>(arr: T[] | undefined, item: T) => {
  if (!arr) {
    return false;
  }
  const index = arr.findIndex((i) => i === item);
  if (index !== -1) {
    arr.splice(index, 1);
    return true;
  }
  return false;
};

export default class SessionTracker {
  private pendingEntries: SessionEntry[] = [];
  private sessionData: SessionData | null = null;

  constructor(private domainSettings: DomainSettings) {
    window.addEventListener('beforeunload', () => {
      // Shouldn't happen because we flush every MAX_TIMEOUT, but just in case.
      this.sendEntries.flush();
      this.persistSessionData.flush();
    });
  }

  async handleEntry({
    timestamp,
    action,
    windowId,
    tabId,
    data,
  }: RawSessionEntry) {
    if (action === 'startup') {
      this.clearSessionData();
      return;
    }

    const session = this.getSessionData();

    if (!windowId) {
      captureMessage('Missing windowId from non-startup session entry');
      return;
    }

    let recordEntry = true;
    let trackUrl: boolean | null = null;

    data = { ...data };
    if (data.url) {
      const parsedURL = safeURL(data.url);
      if (parsedURL) {
        const host = parsedURL.host;
        const hostSettings = this.domainSettings.getForHost(host);
        trackUrl = !!hostSettings?.session;
      }
      if (!trackUrl) {
        data.url = '<NOTTRACKED>';
      }
    }

    const [window, tab] = this.getWindowAndTab(windowId, tabId);

    switch (action) {
      case 'tabCreate':
        // Prefer the existing details in case we got out of order events
        tab!.opener = data.opener;
        tab!.softOpener =
          session.windows[`${session.focusedWindow}`]?.activeTab;
        recordEntry = !!trackUrl;
        break;
      case 'tabActivate':
        // If we're activating a tab we don't care about, coming from a tab we don't care about, don't record.
        if (!tab?.track) {
          tabId = -1;
          const lastActiveTab = window.activeTab;
          if (!session.tabs[`${lastActiveTab}`]?.track) {
            recordEntry = false;
          }
        }
        window.activeTab = tabId!;
        break;
      case 'urlChange':
        if (!tab || !tabId) {
          captureMessage('Missing tab from tab-based event');
          return;
        }
        // In case we somehow missed a tabActivate event
        if (!tab.track && !trackUrl) {
          // Still track if we're moving off another tab
          if (session.tabs[`${window.activeTab}`]?.track) {
            tabId = -1;
          } else {
            recordEntry = false;
          }
        }
        // In case we somehow missed a tabActivate event
        if (data.active) {
          window.activeTab = tabId!;
        }
        if (tab.opener) {
          data.opener = session.tabs[tab.opener]?.track ? tab.opener : -1;
        }
        if (tab.softOpener) {
          data.softOpener = session.tabs[tab.softOpener]?.track
            ? tab.softOpener
            : -1;
        }
        break;
      case 'tabWindowMove':
        if (!tab || !tabId) {
          captureMessage('Missing tab from tab-based event');
          return;
        }
        const previousWindowId = tab.window;
        if (previousWindowId && previousWindowId !== windowId) {
          removeItem(session.windows[`${previousWindowId}`]?.tabs, tabId);
          // The tab was already added to the new window in getWindowAndTab
        }
        tab.window = windowId;
        recordEntry = tab.track;
        break;
      case 'tabClose':
        if (!tab || !tabId) {
          captureMessage('Missing tab from tab-based event');
          return;
        }
        if (!tab.track) {
          recordEntry = false;
        }
        removeItem(window.tabs, tabId);
        delete session.tabs[`${tabId}`];
        break;
      case 'windowFocus':
        const lastActiveTab =
          session.windows[`${session.focusedWindow}`]?.activeTab;
        session.focusedWindow = windowId;
        const activeTab = window.activeTab;
        if (!session.tabs[`${activeTab}`]?.track) {
          windowId = -1;
          if (!session.tabs[`${lastActiveTab}`]?.track) {
            recordEntry = false;
          }
        }
        break;
      case 'windowClose':
        delete session.windows[`${windowId}`];
        recordEntry = false;
        break;
    }

    if (trackUrl !== null && tab) {
      tab.track = trackUrl;
    }

    this.persistSessionData();

    if (recordEntry) {
      this.recordEntry({
        browserInstanceId: session.id,
        action,
        data,
        timestamp,
        tabId,
        windowId,
      });
    }
  }

  private getWindowAndTab(
    windowId: number,
    tabId?: number
  ): [SessionWindow, SessionTab | null] {
    const session = this.getSessionData();
    if (!(windowId in session.windows)) {
      session.windows[`${windowId}`] = { activeTab: -1, tabs: [] };
    }
    const window = session.windows[`${windowId}`];
    let tab: SessionTab | null = null;
    if (tabId) {
      if (!(tabId in session.tabs)) {
        session.tabs[`${tabId}`] = { track: false, window: windowId };
      }
      tab = session.tabs[`${tabId}`];
      // Don't update tab.window here because we need the old value for tabWindowMove
      if (!window.tabs.includes(tabId)) {
        window.tabs.push(tabId);
      }
    }
    return [window, tab];
  }

  private clearSessionData() {
    window.localStorage.removeItem(SESSION_DATA_KEY);
    this.sessionData = null;
  }

  private getSessionData(): SessionData {
    if (!this.sessionData) {
      let rawSession = window.localStorage.getItem(SESSION_DATA_KEY);
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          if (
            typeof session === 'object' &&
            'version' in session &&
            session.version === SESSION_DATA_VERSION
          ) {
            this.sessionData = session;
          } else {
            console.log('Clearing invalid session data');
            window.localStorage.removeItem(SESSION_DATA_KEY);
          }
        } catch (e) {}
      }
    }

    if (!this.sessionData) {
      this.sessionData = {
        version: SESSION_DATA_VERSION,
        id: `browser_0${randomString(22)}`,
        tabs: {},
        windows: {},
        focusedWindow: -1,
      };
    }

    return this.sessionData;
  }

  private recordEntry(props: SessionEntry) {
    this.pendingEntries.push(props);
    this.sendEntries();
  }

  private persistSessionData = debounce(
    () => {
      window.localStorage.setItem(
        SESSION_DATA_KEY,
        JSON.stringify(this.sessionData)
      );
    },
    1000,
    { maxWait: MAX_TIMEOUT }
  );

  private sendEntries = debounce(
    () => {
      const currentEntries = this.pendingEntries;
      this.pendingEntries = [];
      if (currentEntries.length === 0) {
        return;
      }
      fetch(SESSION_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentEntries),
        keepalive: true,
      }).catch((e) => {
        console.log('Failed to send session entry, ignoring', e);
      });
    },
    1000,
    { maxWait: MAX_TIMEOUT }
  );
}
