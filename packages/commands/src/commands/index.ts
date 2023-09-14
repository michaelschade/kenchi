import { ICommands, IMessageRouter } from '@michaelschade/kenchi-message-router';

import App from './app';
import Background from './background';
import ContentScript from './contentScript';
import HostedBackground from './hostedBackground';
import HUD from './hud';
import PageScript from './pageScript';

export interface Commands extends ICommands {
  app: App;
  background: Background;
  contentScript: ContentScript;
  hostedBackground: HostedBackground;
  hud: HUD;
  iframe: { 'system:ready': { origin: 'app'; args: {}; resp: void } };
  pageScript: PageScript;
}

export type KenchiMessageRouter<TNode extends string> = IMessageRouter<
  Commands,
  TNode
>;
