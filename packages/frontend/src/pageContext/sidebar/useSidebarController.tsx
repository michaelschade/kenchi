import { createContext, useContext, useEffect, useState } from 'react';

import { useHistory } from 'react-router-dom';

import { State } from '../../utils/history';
import useMessageRouter, {
  useMessageRouterReady,
} from '../../utils/useMessageRouter';
import { DomainSettings } from '../domainSettings/DomainSettingsController';
import { useDomainSettingsController } from '../domainSettings/useDomainSettingsController';
import { usePageUrlObserver } from '../pageUrl/usePageUrlObserver';
import SidebarController from './SidebarController';

const InternalProvider = createContext<SidebarController | null>(null);

export const SidebarControllerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const messageRouter = useMessageRouter();
  const pageUrlObserver = usePageUrlObserver();
  const domainSettingsController = useDomainSettingsController();
  const history = useHistory<State>();

  const [sidebarController] = useState(
    () => new SidebarController(messageRouter, history)
  );

  useEffect(() => {
    const listener = (url: URL) => sidebarController.setPageUrl(url);
    pageUrlObserver.addListener(listener);
    return () => pageUrlObserver.removeListener(listener);
  }, [sidebarController, pageUrlObserver]);

  useEffect(() => {
    const listener = (domainSettings: DomainSettings) =>
      sidebarController.onDomainSettingsUpdate(domainSettings);
    domainSettingsController.addListener(listener);
    return () => domainSettingsController.removeListener(listener);
  }, [sidebarController, domainSettingsController]);

  useEffect(() => sidebarController.register(), [sidebarController]);
  useMessageRouterReady<'app'>('iframe');

  return (
    <InternalProvider.Provider value={sidebarController}>
      {children}
    </InternalProvider.Provider>
  );
};

export function useSidebarController() {
  return useContext(InternalProvider);
}
