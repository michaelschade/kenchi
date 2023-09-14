import { useEffect, useState } from 'react';

import { usePageUrlObserver } from './usePageUrlObserver';

export function usePageUrl() {
  const pageUrlObserver = usePageUrlObserver();
  const [pageUrl, setPageUrl] = useState<URL | undefined>(() =>
    pageUrlObserver._currentUrl()
  );
  useEffect(() => {
    pageUrlObserver.addListener(setPageUrl);
    return () => pageUrlObserver.removeListener(setPageUrl);
  }, [pageUrlObserver]);
  return pageUrl;
}
