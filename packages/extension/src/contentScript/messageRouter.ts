import { Commands, getTopology, KenchiMessageRouter } from '@kenchi/commands';
import MessageRouter, {
  ExtensionNodeConfig,
  WindowNodeConfig,
} from '@michaelschade/kenchi-message-router';

import { lighterLogger } from '../utils';

type OnTabId = (tabId: number) => void;
type OnHudWindow = (window: Window) => void;

export function initMessageRouter(): [
  KenchiMessageRouter<'contentScript'>,
  { onTabId: OnTabId; onHudWindow: OnHudWindow }
] {
  const contentScriptNodeConfig = new ExtensionNodeConfig(
    process.env.EXTENSION_ID,
    'tab'
  );
  const iframeNodeConfig = new ExtensionNodeConfig(
    process.env.EXTENSION_ID,
    'frame'
  );

  const hudNodeConfig = new WindowNodeConfig(process.env.APP_HOST);

  const router = new MessageRouter<Commands, 'contentScript'>(
    {
      background: new ExtensionNodeConfig(
        process.env.EXTENSION_ID,
        'background'
      ),
      contentScript: [
        contentScriptNodeConfig,
        new WindowNodeConfig(window.location.origin, window),
      ],
      pageScript: new WindowNodeConfig(window.location.origin, window),
      iframe: iframeNodeConfig,
      hud: hudNodeConfig,
    },
    getTopology(process.env.APP_HOST, process.env.EXTENSION_ID),
    'contentScript',
    lighterLogger
  );

  const onTabId: OnTabId = (tabId) => {
    iframeNodeConfig.tabId = tabId;
    contentScriptNodeConfig.tabId = tabId;
  };

  const onHudWindow: OnHudWindow = (window) => {
    hudNodeConfig.setWindow(window);
  };

  return [router, { onTabId, onHudWindow }];
}
