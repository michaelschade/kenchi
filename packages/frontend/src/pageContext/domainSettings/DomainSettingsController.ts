import { captureMessage } from '@sentry/react';

import { InsertionPath, KenchiMessageRouter } from '@kenchi/commands';

import { isDemoUrl } from '../../demo/utils';
import { DomainFragment, DomainSettingsQuery } from '../../graphql/generated';
import { getDomain } from '../../utils';

export type DomainSettings = {
  name: string | null;
  open: boolean | null;
  side: string | null;
  customPlacements: Record<string, { name: string; style: string }> | null;
  insertionPath: InsertionPath | null;
  variableExtractors: Record<string, any>[]; // Store all settings since they stack
};

type DomainSettingsListener = (domainSettings: DomainSettings) => void;

export default class DomainSettingsController {
  private firstUrl: URL | null = null;
  private rawSettings: DomainSettingsQuery | null = null;
  private domainSettings: DomainSettings | null = null;
  private listeners: DomainSettingsListener[] = [];

  constructor(private messageRouter: KenchiMessageRouter<'app'>) {}

  setPageUrl(url: URL) {
    // We assume host never changes within a single instance
    if (!this.firstUrl) {
      this.firstUrl = url;
      this.maybeCollapseSettingsOnURL();
    }
  }

  setRawSettings(settings: DomainSettingsQuery) {
    if (!this.rawSettings) {
      this.rawSettings = settings;
      this.maybeCollapseSettingsOnURL();
    }
  }

  addListener(listener: DomainSettingsListener) {
    this.listeners.push(listener);
    if (this.domainSettings) {
      listener(this.domainSettings);
    }
  }

  removeListener(listener: DomainSettingsListener) {
    const idx = this.listeners.findIndex((l) => l === listener);
    if (idx === -1) {
      throw new Error('Listener not found');
    }
    this.listeners.splice(idx, 1);
  }

  update({ side, open }: { side?: string; open?: boolean }) {
    if (open !== undefined && this.firstUrl) {
      // Optimistic update: don't wait
      this.messageRouter.sendCommand('hostedBackground', 'setDomainSettings', {
        host: this.firstUrl.host,
        open,
      });
    }

    // TODO: handle update before settings are loaded?
    if (this.domainSettings) {
      const newSettings = { ...this.domainSettings };
      if (side !== undefined) {
        newSettings.side = side;
      }
      if (open !== undefined) {
        newSettings.open = open;
      }
      Object.freeze(newSettings);
      this.domainSettings = newSettings;
      this.listeners.forEach((listener) => listener(newSettings));
    }
  }

  private maybeCollapseSettingsOnURL() {
    if (!this.firstUrl || !this.rawSettings) {
      return;
    }
    const host = this.firstUrl.host;

    const collapsedSettings: DomainSettings = {
      name: null,
      open: null,
      side: null,
      customPlacements: null,
      variableExtractors: [],
      insertionPath: null,
    };

    const viewer = this.rawSettings.viewer;
    if (!viewer) {
      console.error('No settings available', this.rawSettings);
      return collapsedSettings;
    }

    const userSettingsList = (viewer.user?.domainSettings?.edges || []).filter(
      ({ node }) => node.domain.hosts.some((h) => h === host)
    );
    if (userSettingsList.length > 1) {
      captureMessage(`Got multiple domains for ${viewer.user?.id}, ${host}`);
    }
    if (userSettingsList.length > 0) {
      const userSettings = userSettingsList[0].node;
      collapsedSettings.open = userSettings.open;
      collapsedSettings.side = userSettings.side;
    }

    const orgSettingsList = this.getListOfDomainSettingsForURL(
      this.firstUrl,
      this.rawSettings
    );

    orgSettingsList.forEach((orgSettings) => {
      if (!collapsedSettings.name && orgSettings.name) {
        collapsedSettings.name = orgSettings.name;
      }
      if (collapsedSettings.open === null && orgSettings.defaultOpen) {
        collapsedSettings.open = orgSettings.defaultOpen;
      }
      if (!collapsedSettings.side && orgSettings.defaultSide) {
        collapsedSettings.side = orgSettings.defaultSide;
      }
      if (orgSettings.customPlacements) {
        collapsedSettings.customPlacements = {
          ...collapsedSettings.customPlacements,
          ...orgSettings.customPlacements,
        };
      }
      if (!collapsedSettings.insertionPath && orgSettings.insertionPath) {
        collapsedSettings.insertionPath = orgSettings.insertionPath;
      }

      if (orgSettings.variableExtractors !== null) {
        collapsedSettings.variableExtractors.push(
          orgSettings.variableExtractors
        );
      }
    });

    // TODO: hacky!
    if (this.firstUrl && isDemoUrl(this.firstUrl)) {
      collapsedSettings.variableExtractors.push({ demo: {} });
      collapsedSettings.insertionPath = {
        type: 'xpath',
        xpath: '//div[has-class("message-text")]',
      };
    }

    Object.freeze(collapsedSettings);

    this.domainSettings = collapsedSettings;
    this.listeners.forEach((listener) => listener(collapsedSettings));
  }

  private getListOfDomainSettingsForURL(
    url: URL,
    settings: DomainSettingsQuery
  ) {
    const host = url.host;
    const viewer = settings?.viewer;
    if (!viewer) {
      console.error('NO DATA');
      return [];
    }

    const domain = getDomain(host);
    let wildcardHost: string | null = null;
    if (domain) {
      wildcardHost = `*.${domain}`;
    }

    const matchHost =
      (host: string) =>
      ({ node }: { node: DomainFragment }) =>
        node.hosts.some((h) => h === host);
    const domainSettings: DomainFragment[] = [];

    const orgDomains = viewer.organization?.domains?.edges || [];
    const defaultDomains = viewer.defaultDomains?.edges || [];

    // We proritize exact matches at the org level, then at the global default level, then wildcards (org then default), then global fallback
    domainSettings.push(
      ...orgDomains.filter(matchHost(host)).map(({ node }) => node)
    );
    domainSettings.push(
      ...defaultDomains.filter(matchHost(host)).map(({ node }) => node)
    );
    if (wildcardHost) {
      domainSettings.push(
        ...orgDomains.filter(matchHost(wildcardHost)).map(({ node }) => node)
      );
      domainSettings.push(
        ...defaultDomains
          .filter(matchHost(wildcardHost))
          .map(({ node }) => node)
      );
    }
    domainSettings.push(
      ...defaultDomains
        .filter(({ node }) => node.hosts.length === 0)
        .map(({ node }) => node)
    );

    return domainSettings;
  }
}
