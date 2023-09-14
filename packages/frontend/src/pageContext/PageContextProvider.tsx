import { createContext, useEffect, useMemo, useState } from 'react';

import { QueryHookOptions } from '@apollo/client';
import { parse } from 'qs';

import useMessageRouter from '../utils/useMessageRouter';
import DomainSettingsController, {
  DomainSettings,
} from './domainSettings/DomainSettingsController';
import { useDomainSettingsQuery } from './domainSettings/useDomainSettingsQuery';
import PageDataController, { PageData } from './pageData/PageDataController';
import PageUrlObserver from './pageUrl/PageUrlObserver';

const refetchOptions: QueryHookOptions = {
  fetchPolicy: 'cache-and-network',
  nextFetchPolicy: 'cache-first',
  pollInterval: 10 * 60 * 1000, // 10m
};

export const InternalProvider = createContext<{
  domainSettingsController: DomainSettingsController;
  pageDataController: PageData;
  pageUrlObserver: PageUrlObserver;
} | null>(null);

export function PageContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const messageRouter = useMessageRouter();

  /**
   * PageUrlObserver
   **/

  const query = parse(window.location.search.substring(1));
  const [pageUrlObserver] = useState(
    () => new PageUrlObserver(query.initialUrl as string | undefined)
  );
  useEffect(
    () => pageUrlObserver.observe(messageRouter),
    [pageUrlObserver, messageRouter]
  );

  /**
   * DomainSettingsController
   **/

  const { data: rawDomainSettings } = useDomainSettingsQuery(refetchOptions);
  const [domainSettingsController] = useState(
    () => new DomainSettingsController(messageRouter)
  );
  useEffect(() => {
    const listener = (url: URL) => domainSettingsController.setPageUrl(url);
    pageUrlObserver.addListener(listener);
    return () => pageUrlObserver.removeListener(listener);
  }, [domainSettingsController, pageUrlObserver]);
  useEffect(
    () =>
      rawDomainSettings &&
      domainSettingsController.setRawSettings(rawDomainSettings),
    [domainSettingsController, rawDomainSettings]
  );

  /**
   * PageDataController
   **/

  const [pageDataController] = useState(
    () => new PageDataController(messageRouter)
  );

  useEffect(() => {
    const listener = (url: URL) => pageDataController.setPageUrl(url);
    pageUrlObserver.addListener(listener);
    return () => pageUrlObserver.removeListener(listener);
  }, [pageDataController, pageUrlObserver]);

  useEffect(() => {
    const listener = (domainSettings: DomainSettings) =>
      pageDataController.onDomainSettingsUpdate(domainSettings);
    domainSettingsController.addListener(listener);
    return () => domainSettingsController.removeListener(listener);
  }, [pageDataController, domainSettingsController]);

  useEffect(() => pageDataController.register(), [pageDataController]);

  /**
   * END
   **/

  const value = useMemo(
    () => ({
      domainSettingsController,
      pageDataController,
      pageUrlObserver,
    }),
    [domainSettingsController, pageDataController, pageUrlObserver]
  );
  return (
    <InternalProvider.Provider value={value}>
      {children}
    </InternalProvider.Provider>
  );
}
