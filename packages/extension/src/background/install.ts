import { captureMessage } from '@sentry/browser';

export default function setupInstallListeners() {
  chrome.runtime.onStartup.addListener(() => refreshUninstallUrl());
  chrome.runtime.onInstalled.addListener(async (details) => {
    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: 'saveToKenchi',
      title: 'Save to Kenchi Snippet',
      contexts: ['selection'],
    });

    refreshUninstallUrl();
    const url = await fetchField('installUrl', {
      reason: details.reason,
      previousVersion: details.previousVersion || null,
    });
    if (url) {
      chrome.tabs.create({ url });
    }
  });

  const refreshUninstallUrl = async () => {
    const url = await fetchField('uninstallUrl');
    if (url !== undefined) {
      chrome.runtime.setUninstallURL(url || '', () => {
        if (chrome.runtime.lastError) {
          captureMessage(
            `Error updating uninstall URL: ${chrome.runtime.lastError.message}`
          );
        }
      });
    }
  };

  const fetchField = async (
    field: string,
    args: Record<string, unknown> = {}
  ): Promise<string | null | undefined> => {
    args.version = chrome.runtime.getManifest().version;
    const argsString = Object.entries(args)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
    const res = await fetch(
      `${process.env.API_HOST}/graphql?query={viewer{${field}(${argsString})}}`
    );
    const data = await res.json();
    if (data?.errors) {
      captureMessage(`Failed to fetch ${field}: ${JSON.stringify(data)}`);
    } else if (data?.data?.viewer) {
      return data.data.viewer[field];
    }
    return undefined;
  };
}
