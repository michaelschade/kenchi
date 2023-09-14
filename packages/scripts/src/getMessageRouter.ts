import { Commands, getTopology } from '@kenchi/commands';
import MessageRouter, {
  BufferedRouter,
  IMessageRouter,
  WindowNodeConfig,
} from '@michaelschade/kenchi-message-router';

import { lighterLogger } from './utils';

declare global {
  interface Window {
    __KenchiMessageRouter: IMessageRouter<Commands, 'pageScript'>;
  }
}

export default function getMessageRouter() {
  if (!window.__KenchiMessageRouter) {
    const messageRouter = new MessageRouter(
      {
        pageScript: new WindowNodeConfig(window.location.origin, window),
        contentScript: new WindowNodeConfig(window.location.origin, window),
      },
      getTopology(process.env.APP_HOST, process.env.EXTENSION_ID),
      'pageScript',
      lighterLogger
    );
    // Since we can inject multiple scripts that use the same messageRouter, we
    // can't rely on the command handlers being initialized when we send the
    // command, since there's a lag between injectScript succeeding and the
    // handlers being registered.
    window.__KenchiMessageRouter = new BufferedRouter<Commands, 'pageScript'>(
      messageRouter,
      ['app', 'hud']
    );
    window.__KenchiMessageRouter.registerListeners();
    window.__KenchiMessageRouter.sendCommand('contentScript', 'system:ready');
  }

  return window.__KenchiMessageRouter;
}
