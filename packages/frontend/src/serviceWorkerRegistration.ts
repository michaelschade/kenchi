import { captureException } from '@sentry/react';

import { isDevelopment, isTest } from './utils';
import { trackEvent } from './utils/analytics';

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://bit.ly/CRA-PWA

export function skipWaiting(
  registration: ServiceWorkerRegistration,
  onActivated?: () => void
) {
  const waitingServiceWorker = registration.waiting;

  if (waitingServiceWorker) {
    console.log('Activating waiting service worker');
    // https://github.com/microsoft/TypeScript/issues/37842
    waitingServiceWorker.addEventListener('statechange', (event: any) => {
      if (event.target.state === 'activated') {
        trackEvent({ category: 'service_worker', action: `update_activated` });
        console.log('Activated new service worker');
        // Where you'd potentially want to force a refresh
        onActivated?.();
      }
    });
    waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
  } else {
    console.log(
      'Tried to skip waiting without having a waiting service worker, assuming someone else activated it.'
    );
    onActivated && onActivated();
  }
}

type ServiceWorkerConfig = {
  updateFrequency?: number;
  onSuccess?: (reg: ServiceWorkerRegistration) => void;
  onUpdate?: (reg: ServiceWorkerRegistration) => void;
};
export function register(config: ServiceWorkerConfig) {
  if (isDevelopment() || isTest()) {
    return;
  }
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // The URL constructor is available in all browsers that support SW.
  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) {
    // Our service worker won't work if PUBLIC_URL is on a different origin
    // from what our page is served on. This might happen if a CDN is used to
    // serve assets; see https://github.com/facebook/create-react-app/issues/2374
    return;
  }

  if (document.readyState === 'complete') {
    registerValidSW(config);
  } else {
    window.addEventListener('load', () => registerValidSW(config));
  }
}

async function registerValidSW(config: ServiceWorkerConfig) {
  const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register(swUrl);
  } catch (e) {
    logFailure(e, 'register');
    return;
  }

  // We have a previously installed registration that hasn't been activated yet
  if (registration.waiting) {
    config.onUpdate?.(registration);
  }
  if (config.updateFrequency) {
    setInterval(() => {
      registration.update().catch((error) => logFailure(error, 'update'));
    }, config.updateFrequency);
  }
  registration.onupdatefound = () => {
    const installingWorker = registration.installing;
    if (installingWorker == null) {
      return;
    }
    installingWorker.onstatechange = () => {
      if (installingWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          trackEvent({ category: 'service_worker', action: `update_ready` });
          if (config.onUpdate) {
            // Execute callback
            config.onUpdate(registration);
          } else {
            console.log(
              'New content is available and will be used when all ' +
                'tabs for this page are closed. See https://bit.ly/CRA-PWA.'
            );
          }
        } else {
          // At this point, everything has been precached.
          console.log('Content is cached for offline use.');

          // Execute callback
          trackEvent({ category: 'service_worker', action: `registered` });
          config?.onSuccess?.(registration);
        }
      }
    };
  };
}

function logFailure(error: unknown, action: 'register' | 'update') {
  if (error instanceof Error) {
    let type: string | null = null;
    if (
      error.name === 'NotSupportedError' &&
      error.message.endsWith(
        'The user denied permission to use Service Worker.'
      )
    ) {
      type = 'not_supported';
    } else if (
      error.name === 'TypeError' &&
      error.message.endsWith(
        'An unknown error occurred when fetching the script.'
      )
    ) {
      type = 'unknown_error';
    } else if (
      error.name === 'AbortError' &&
      error.message.endsWith(
        'Timed out while trying to start the Service Worker.'
      )
    ) {
      type = 'timeout';
    }

    if (type) {
      console.log('Ignoring service worker error', type, error.message);
      trackEvent({
        category: 'service_worker',
        action: `${action}_${type}`,
        label: error.message,
      });
      // Don't bother capturing
      return;
    }
  }

  captureException(error);
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
