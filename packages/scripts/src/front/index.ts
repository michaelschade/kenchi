import getMessageRouter from '../getMessageRouter';
import { sendEvent } from '../utils';
import {
  originObserver,
  ReduxStore,
  ReduxStoreObserver,
} from './reduxStoreObserver';
import { findReduxStore } from './utils';

const APP_ROOT_SELECTOR = '#front-app-root';

const router = getMessageRouter();

let reduxObserver: ReduxStoreObserver | null = null;

router.addCommandHandler(
  ['app', 'hud'],
  'frontInit',
  async (_args, _command, origin) => {
    if (!reduxObserver) {
      const reduxStore: ReduxStore = findReduxStore(APP_ROOT_SELECTOR);
      if (!reduxStore) {
        throw new Error('Could not find redux store');
      }
      reduxObserver = new ReduxStoreObserver(reduxStore);
    }

    reduxObserver.subscribe(originObserver(router, origin));
  }
);

router.addCommandHandler(['app', 'hud'], 'prepareForInsertion', async () => {
  // The messageViewerActionZone* classes only appear when viewing a message
  // without the editor open.
  sendEvent(
    'div[class^="messageViewerActionZone"] div[role="button"]',
    'click'
  );
});
