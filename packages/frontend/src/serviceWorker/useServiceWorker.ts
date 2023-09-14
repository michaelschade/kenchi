import { useContext } from 'react';

import { ServiceWorkerContext } from './ServiceWorkerProvider';

export const useServiceWorker = () => {
  const state = useContext(ServiceWorkerContext);
  return state;
};
