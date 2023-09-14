import { CommandDetails } from '@michaelschade/kenchi-message-router';

import { Conforms, SharedSettingsResp } from './types';

interface MaybeInject extends CommandDetails {
  origin: 'background';
  args: { url: string };
  resp: { inject: boolean; injectGmail: boolean };
}

export type SessionEntry = {
  timestamp: number;
  action:
    | 'startup'
    | 'windowFocus'
    | 'windowClose'
    | 'tabCreate'
    | 'tabClose'
    | 'tabWindowMove'
    | 'tabActivate'
    | 'urlChange';
  windowId?: number;
  tabId?: number;
  data: Record<string, any>;
};

type HostedBackground = Conforms<{
  newTogglePressed: MaybeInject;
  pageLoaded: MaybeInject;

  getDomainSettings: {
    origin: 'background';
    args: { url: string };
    resp: { settings: SharedSettingsResp };
  };

  setDomainSettings: {
    origin: 'app';
    args: { host: string; open: boolean };
    resp: void;
  };

  sessionEntry: {
    origin: 'background';
    args: SessionEntry;
    resp: void;
  };
}>;

export default HostedBackground;
