import { useContext } from 'react';

import { InternalProvider } from '../PageContextProvider';

export function usePageDataController() {
  const provider = useContext(InternalProvider);
  if (!provider) {
    throw new Error('No page context found');
  }
  return provider.pageDataController;
}
