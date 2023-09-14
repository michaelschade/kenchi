import { createContext, useEffect, useState } from 'react';

import * as serviceWorker from '../serviceWorkerRegistration';

type ServiceWorkerState = {
  needsUpdate: boolean;
};

const initialState: ServiceWorkerState = {
  needsUpdate: false,
};

export const ServiceWorkerContext =
  createContext<ServiceWorkerState>(initialState);

type Props = {
  children: React.ReactNode;
};

export const ServiceWorkerProvider = ({ children }: Props) => {
  const [state, setState] = useState<ServiceWorkerState>(initialState);

  useEffect(() => {
    serviceWorker.register({
      updateFrequency: 5 * 60 * 1000, // 5m
      onUpdate: async (registration: ServiceWorkerRegistration) => {
        // We're potentially about to load this module, make sure we do so
        // before we swap out the service worker.
        let needsUpdateComponentLoaded = false;
        try {
          await import('../components/NeedsUpdate');
          needsUpdateComponentLoaded = true;
        } catch (e) {
          console.log(
            'Failed to load NeedsUpdate component, activating worker without it'
          );
        }
        // If we activate a new service worker on pageload we may cause it to
        // fail to load `/` (since we could be between pulling chunks). Add a
        // delay to minimize the risk of a race condition.
        window.setTimeout(() => {
          serviceWorker.skipWaiting(registration, () => {
            window.needsUpdate = true;
            if (needsUpdateComponentLoaded) {
              setState((prevState) => ({
                ...prevState,
                needsUpdate: true,
              }));
            }
          });
        }, 5 * 1000); // 5s
      },
    });
  }, []);

  return (
    <ServiceWorkerContext.Provider value={state}>
      {children}
    </ServiceWorkerContext.Provider>
  );
};
