/// <reference types="chrome"/>

import Result from '@kenchi/shared/lib/Result';

import { RecordingNetworkRequest } from '../sharedTypes';
import { Conforms, SharedSettingsResp } from './types';

// The background tab has access to a send arg in its handler, so we need to
// mark this as optional so sendCommand doesn't try to require it.
type SenderArg = { sender?: chrome.runtime.MessageSender };

type Background = Conforms<{
  'system:ready': {
    origin: 'hostedBackground';
    args: {};
    resp: void;
  };

  ping: {
    origin: 'contentScript';
    args: SenderArg;
    resp: {
      tabId: number;
      settings?:
        | ({ pageType: 'content' } & SharedSettingsResp)
        | {
            pageType: 'recording';
            isPaused: boolean;
            initialStyle: string | null;
          };
    };
  };

  checkInstallStatus: {
    origin: 'dashboard';
    args: SenderArg;
    resp: {
      tabId: number;
      installed: boolean;
      version: string;
      commands: {
        name?: string;
        description?: string;
        shortcut?: string;
      }[];
    };
  };

  datasourceFetchRun: {
    origin: 'app' | 'hud' | 'dashboard';
    args: { url: string; opts: RequestInit };
    resp: Result<
      { status: number; headers: Record<string, string>; bodyText: string },
      string
    >;
  };

  recordStart: {
    origin: 'dashboard';
    args: SenderArg;
    resp: void;
  };

  recordCancel: {
    origin: 'contentScript' | 'dashboard';
    args: {};
    resp: void;
  };

  recordPause: {
    origin: 'contentScript';
    args: {};
    resp: void;
  };

  recordResume: {
    origin: 'contentScript';
    args: {};
    resp: void;
  };

  recordDone: {
    origin: 'contentScript';
    args: SenderArg;
    resp: Result<string, string>;
  };

  // In an ideal world the background would ping the dashboard with this data,
  // but that's not possible with ExtensionMessagingStrategy right now: we'd
  // need to switch from onMessage to onConnect since all connections need to be
  // initiated by the external page.
  recordProcessPoll: {
    origin: 'dashboard';
    args: {};
    resp: Result<
      {
        networkRequests: RecordingNetworkRequest[];
        lastUrl: string;
        // pageEvents: any[];
      },
      'window_closed' | 'not_finished' | 'no_active_recording'
    >;
  };

  sendToShortcutsPage: {
    origin: 'dashboard';
    args: {};
    resp: void;
  };
}>;

export default Background;
