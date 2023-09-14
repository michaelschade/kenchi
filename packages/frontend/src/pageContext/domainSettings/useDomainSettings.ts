import { useEffect, useState } from 'react';

import { DomainSettings } from './DomainSettingsController';
import { useDomainSettingsController } from './useDomainSettingsController';

export function useDomainSettings(): [
  DomainSettings | null,
  (args: { side?: string; open?: boolean }) => void
] {
  const dsc = useDomainSettingsController();
  const [domainSettings, setDomainSettings] = useState<DomainSettings | null>(
    null
  );

  useEffect(() => {
    dsc.addListener(setDomainSettings);
    return () => dsc.removeListener(setDomainSettings);
  }, [dsc]);

  return [domainSettings, dsc.update.bind(dsc)];
}
