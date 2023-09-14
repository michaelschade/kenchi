import { addBreadcrumb } from '@sentry/react';

import { KenchiMessageRouter } from '@kenchi/commands';

import { safeURL } from '../../utils';
import { setAnalyticsPageUrl } from '../../utils/analytics';

type PageUrlListener = (url: URL) => void;

export default class PageUrlObserver {
  private listeners: PageUrlListener[] = [];
  private url?: URL;

  constructor(initialUrl?: string) {
    if (initialUrl) {
      this.updateUrl(initialUrl);
    }
  }

  updateUrl(urlString: string) {
    if (this.url && urlString === this.url.toString()) {
      return;
    }

    addBreadcrumb({
      category: `page.${this.url ? 'navigation' : 'url'}`,
      message: urlString,
      level: 'info',
    });
    setAnalyticsPageUrl(urlString);

    const url = safeURL(urlString);
    if (!url) {
      throw new Error(`Got invalid URL: ${urlString}`);
    }

    this.url = url;
    this.listeners.forEach((listener) => listener(url));
  }

  // You should strongly prefer a listener that will update when the URL changes.
  _currentUrl(): URL | undefined {
    return this.url;
  }

  observe(messageRouter: KenchiMessageRouter<'app' | 'hud'>) {
    // Ignore start time for now (was used in telemetry)
    const handler = async ({ url }: { url: string; start?: number }) =>
      this.updateUrl(url);

    messageRouter.addCommandHandler('background', 'urlChanged', handler);
    return () =>
      messageRouter.removeCommandHandler('background', 'urlChanged', handler);
  }

  addListener(listener: PageUrlListener) {
    this.listeners.push(listener);
    if (this.url) {
      listener(this.url);
    }
  }

  removeListener(listener: PageUrlListener) {
    const idx = this.listeners.findIndex((l) => l === listener);
    if (idx === -1) {
      throw new Error('Listener not found');
    }
    this.listeners.splice(idx, 1);
  }
}
