import { parse } from 'qs';

import { getTopology } from '@kenchi/commands';
import MessageRouter, {
  ExtensionNodeConfig,
  WindowNodeConfig,
} from '@michaelschade/kenchi-message-router';

import { lighterLogger } from '../utils';

const query = parse(window.location.search.substring(1));
if (typeof query.tab !== 'string') {
  throw new Error('missing tab ID');
}

const tabId = parseInt(query.tab);

const iframe = document.createElement('iframe');
iframe.allow = 'clipboard-write';
document.body.appendChild(iframe);
iframe.src = `${process.env.APP_HOST}/${window.location.search}${window.location.hash}`;

const router = new MessageRouter(
  {
    iframe: [
      new ExtensionNodeConfig(process.env.EXTENSION_ID, 'frame'),
      new WindowNodeConfig(window.location.origin, window),
    ],
    contentScript: new ExtensionNodeConfig(
      process.env.EXTENSION_ID,
      'tab',
      tabId
    ),
    background: new ExtensionNodeConfig(process.env.EXTENSION_ID, 'background'),
    app: new WindowNodeConfig(process.env.APP_HOST, iframe.contentWindow!),
  },
  getTopology(process.env.APP_HOST, process.env.EXTENSION_ID),
  'iframe',
  lighterLogger
);
router.registerListeners();
