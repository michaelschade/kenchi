import { useCallback, useEffect, useState } from 'react';

import useMessageRouter from '../../utils/useMessageRouter';

export const useExtensionStatus = () => {
  const [hasExtension, setHasExtension] = useState<boolean | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);
  const [keyboardShortcutsRegistered, setKeyboardShortcutsRegistered] =
    useState<boolean | null>(null);
  const router = useMessageRouter<'dashboard'>();
  const checkInstallStatus = useCallback(async () => {
    try {
      const installStatus = await router.sendCommand(
        'background',
        'checkInstallStatus',
        {}
      );
      setHasExtension(true);
      const { commands, tabId } = installStatus;
      setTabId(tabId);
      const shortcutForOpenRegistered = commands.some(
        (command) => command.name === 'activate' && command.shortcut !== ''
      );
      setKeyboardShortcutsRegistered(shortcutForOpenRegistered);
    } catch (e) {
      setHasExtension(false);
    }
  }, [router]);
  useEffect(() => {
    checkInstallStatus();
    const pollForInstallStatus = setInterval(() => checkInstallStatus(), 5000);
    return () => clearInterval(pollForInstallStatus);
  }, [checkInstallStatus]);

  return { hasExtension, keyboardShortcutsRegistered, tabId };
};
