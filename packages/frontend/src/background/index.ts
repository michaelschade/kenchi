import { Commands, getTopology } from '@kenchi/commands';
import MessageRouter, { WindowNodeConfig } from '@michaelschade/kenchi-message-router';

import { isDemoUrl } from '../demo/utils';
import * as serviceWorker from '../serviceWorkerRegistration';
import { isMessageRouterErrorType, safeURL } from '../utils';
import { initSentry } from '../utils/sentry';
import { MAX_TIMEOUT } from './constants';
import DomainSettings from './DomainSettings';
import SessionTracker from './SessionTracker';

initSentry();

const router = new MessageRouter<Commands, 'hostedBackground'>(
  {
    hostedBackground: new WindowNodeConfig(window.location.origin, window),
    background: new WindowNodeConfig(
      `chrome-extension://${process.env.REACT_APP_EXTENSION_ID}`,
      window.parent
    ),
  },
  getTopology(process.env.REACT_APP_HOST, process.env.REACT_APP_EXTENSION_ID),
  'hostedBackground'
);

const domainSettings = new DomainSettings(() => {
  router.sendCommand('background', 'system:ready').catch((error) => {
    // We reload after an update is detected, which would trigger this error.
    if (isMessageRouterErrorType(error, 'alreadyReady')) {
      console.log(
        'System already initialized, we probably updated the serviceWorker'
      );
    } else {
      throw error;
    }
  });
});

router.addCommandHandler('background', 'newTogglePressed', () => {
  return Promise.resolve({
    inject: true,
    // TODO: maybe inject the HUD too when they press ctrl+space?
    // Vestigal: if we're on gmail we have already injected gmail code, so we never need to do so again.
    injectGmail: false,
  });
});

router.addCommandHandler('background', 'pageLoaded', ({ url }) => {
  const parsedURL = safeURL(url);
  if (!parsedURL) {
    return Promise.reject({ error: 'invalidURL' });
  }
  if (isDemoUrl(parsedURL)) {
    return Promise.resolve({ inject: true, injectGmail: false });
  }
  const host = parsedURL.host;
  const settings = domainSettings.getForHost(host);
  return Promise.resolve({
    inject:
      settings?.inject || settings?.sidebarOpen || settings?.injectHud || false,
    injectGmail: settings?.isGmail || false,
  });
});

router.addCommandHandler('background', 'getDomainSettings', ({ url }) => {
  const parsedURL = safeURL(url);
  if (!parsedURL) {
    return Promise.reject({ error: 'invalidURL' });
  }
  const host = parsedURL.host;
  const hostSettings = domainSettings.getForHost(host);

  const injectHud = isDemoUrl(parsedURL)
    ? true
    : hostSettings?.injectHud ?? null;

  const injectSidebar =
    (hostSettings?.injectSidebar || hostSettings?.sidebarOpen) ?? null;

  return Promise.resolve({
    settings: {
      inject: hostSettings?.inject || injectHud || injectSidebar,
      injectHud: injectHud ? 'deferred' : false,
      injectSidebar,
      isGmail: hostSettings?.isGmail ?? null,
      initialStyle: `
        #kenchi-iframe {
          height: 100vh;
          z-index: 100001;
          border: none;
        }
      `,
    },
  });
});

router.addCommandHandler('app', 'setDomainSettings', async ({ host, open }) => {
  domainSettings.setForHost(host, open);
});

const sessionTracker = new SessionTracker(domainSettings);
router.addCommandHandler('background', 'sessionEntry', (args) =>
  sessionTracker.handleEntry(args)
);

router.registerListeners();

// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register({
  onUpdate: (registration: ServiceWorkerRegistration) => {
    // If we activate a new service worker on pageload we may cause it to
    // fail to load `/` (since we could be between pulling chunks). Add a
    // delay to minimize the risk of a race condition.
    window.setTimeout(() => {
      serviceWorker.skipWaiting(registration, () => {
        window.location.reload();
      });
    }, MAX_TIMEOUT);
  },
});
