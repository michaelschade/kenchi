import {
  ApolloClient,
  ApolloError,
  ApolloQueryResult,
  gql,
  NormalizedCacheObject,
} from '@apollo/client/core';
import { captureException, captureMessage } from '@sentry/react';

import { getClient } from '../graphql/client';
import { BackgroundDomainSettingsQuery } from '../graphql/generated';
import { onLogin } from '../login/utils';
import { forgivingLocalGet, forgivingLocalSet, getDomain } from '../utils';
import { setSentryUser } from '../utils/sentry';

const QUERY = gql`
  query BackgroundDomainSettingsQuery {
    viewer {
      defaultDomains(first: 1000) {
        edges {
          node {
            ...BackgroundDomainFragment
          }
        }
      }
      user {
        id
        email
        domainSettings(first: 1000) {
          edges {
            node {
              id
              domain {
                id
                hosts
              }
              open
              injectHud
            }
          }
        }
      }
      organization {
        id
        shadowRecord
        domains(first: 1000) {
          edges {
            node {
              ...BackgroundDomainFragment
            }
          }
        }
      }
    }
  }

  fragment BackgroundDomainFragment on Domain {
    id
    hosts
    inject
    injectHud
    injectSidebar
    isGmail
    defaultOpen
    trackSession
  }
`;

const SERVER_POLL_DEBOUNCE = 5 * 60 * 1000; // 5m

type HostSettings = {
  inject: boolean | null; // inject the contentScript even if we don't need to for sidebar or hud
  injectSidebar: boolean | null;
  injectHud: boolean | null;

  isGmail: boolean | null; // special handling for gmail, since InboxSDK needs to be loaded via the extension

  sidebarOpen: boolean | null;
  session: boolean | null;
};
const emptyHostSettings: HostSettings = {
  inject: null,
  injectSidebar: null,
  injectHud: null,

  isGmail: null,

  sidebarOpen: null,
  session: null,
};

const DEFAULT_KEY = '__default';

export default class DomainSettings {
  private graphqlClient?: ApolloClient<NormalizedCacheObject>;
  private lastQueryTime?: number;
  private initialized = false;
  private lastSuccessfulFetch: number | null = null;

  private cachedHostMap: { [host: string]: HostSettings } = {};

  constructor(private onInitialized: () => void) {
    this.loadCache();
    this.graphqlClient = getClient();
    onLogin(() => {
      this.makeQuery();
    });

    this.makeQuery();
  }

  public getForHost(host: string): HostSettings | null {
    if (!this.initialized) {
      captureMessage('Fetching open state pre-initialization');
      return null;
    }

    // This won't affect current response, but maybe schedule a refresh
    // TODO: this happens on every pageload. Maybe not? Probably want just opens.
    this.maybeRefreshQuery();

    // Priotirize any settings for the domain, if null fall back to wildcard.

    let settings: HostSettings | null = null;
    if (host in this.cachedHostMap) {
      settings = { ...this.cachedHostMap[host] };
    }
    let wildcardSettings: HostSettings | null = null;

    const domain = getDomain(host);
    if (domain) {
      const domainKey = `*.${domain}`;
      if (domainKey in this.cachedHostMap) {
        wildcardSettings = this.cachedHostMap[domainKey];
      }
    }

    // Promote wildcardSettings if it's the only one
    if (!settings && wildcardSettings) {
      settings = { ...wildcardSettings };
      wildcardSettings = null;
    }

    if (!settings) {
      return null;
    }

    if (wildcardSettings) {
      Object.entries(wildcardSettings).forEach(([k, value]) => {
        const key = k as keyof HostSettings;
        if (settings && settings[key] === null) {
          settings[key] = value as any;
        }
      });
    }

    if (this.cachedHostMap[DEFAULT_KEY]) {
      Object.entries(this.cachedHostMap[DEFAULT_KEY]).forEach(([k, value]) => {
        const key = k as keyof HostSettings;
        if (settings && settings[key] === null) {
          settings[key] = value as any;
        }
      });
    }

    return settings;
  }

  private maybeInitialize() {
    if (!this.initialized) {
      this.initialized = true;
      this.onInitialized();
    }
  }

  private async makeQuery() {
    if (!this.graphqlClient) {
      captureMessage('graphqlClient not initialized');
      return;
    }
    // Go by query time, not results time, so we don't inflight 2 queries simultaneously
    this.lastQueryTime = Date.now();
    try {
      const res = await this.graphqlClient.query<BackgroundDomainSettingsQuery>(
        {
          query: QUERY,
          fetchPolicy: 'network-only',
        }
      );

      this.handleQueryResults(res);
    } catch (error) {
      if (!this.initialized) {
        console.log(
          'Failed to fetch initial domain settings, initializing anyway'
        );
        captureException(error);
        this.maybeInitialize();
      } else if (
        error instanceof ApolloError &&
        error.networkError?.message === 'Failed to fetch'
      ) {
        if (
          !this.lastSuccessfulFetch ||
          this.lastSuccessfulFetch < new Date().getTime() - 4 * 60 * 60 * 1000
        ) {
          captureMessage(
            'Failed to refetch domain settings over 4 hours, ignoring'
          );
        } else {
          console.log(
            'Failed to refetch domain settings due to network error, ignoring',
            error
          );
        }
      } else {
        throw error;
      }
    }
  }

  private updateCacheEntry(host: string, values: HostSettings) {
    let settings = this.cachedHostMap[host];
    if (!settings) {
      this.cachedHostMap[host] = { ...emptyHostSettings };
      settings = this.cachedHostMap[host];
    }
    Object.entries(values).forEach(([k, value]) => {
      const key = k as keyof HostSettings;
      if (value !== undefined && value !== null) {
        settings[key] = value as any;
      }
    });
  }

  private updateCacheFromUserSettings(
    host: string,
    { open, injectHud }: { open: boolean | null; injectHud: boolean | null }
  ) {
    if (open === null && injectHud === null) {
      return;
    }
    let settings = this.cachedHostMap[host];
    if (!settings) {
      this.cachedHostMap[host] = { ...emptyHostSettings };
      settings = this.cachedHostMap[host];
    }
    if (open !== null) {
      settings.sidebarOpen = open;
    }
    if (injectHud !== null) {
      settings.injectHud = injectHud;
    }
  }

  private saveCache() {
    console.log(`Saving ${Object.keys(this.cachedHostMap).length} cache keys`);
    forgivingLocalSet(
      'background-settings',
      JSON.stringify(this.cachedHostMap)
    );
  }

  private loadCache() {
    const cache = forgivingLocalGet('background-settings');
    if (cache) {
      try {
        this.cachedHostMap = JSON.parse(cache);
        if (this.cachedHostMap) {
          console.log(
            `Restored ${Object.keys(this.cachedHostMap).length} cache keys`
          );
          this.maybeInitialize();
        }
      } catch (e) {}
    }
  }

  private handleQueryResults(
    res: ApolloQueryResult<BackgroundDomainSettingsQuery>
  ) {
    const viewer = res.data?.viewer;
    if (!viewer) {
      // should be impossible
      throw new Error('Failed to load domain settings');
    }

    this.lastSuccessfulFetch = new Date().getTime();
    this.cachedHostMap = {};

    /**
     * updateCacheEntry overrides the cache with each non-null value, so
     * starting with lowest priority:
     *   1. default domain settings
     *   2. organization domain settings
     *   3. user domain settings (just open)
     **/

    if (viewer.defaultDomains) {
      const {
        defaultDomains: { edges: defaultDomainEdges },
      } = viewer;

      defaultDomainEdges.forEach(({ node: domain }) => {
        const domainCacheEntry: HostSettings = {
          inject: domain.inject,
          injectHud: domain.injectHud,
          injectSidebar: domain.injectSidebar,
          isGmail: domain.isGmail,
          sidebarOpen: domain.defaultOpen,
          session: domain.trackSession,
        };
        if (domain.hosts.length === 0) {
          this.updateCacheEntry(DEFAULT_KEY, domainCacheEntry);
        }
        domain.hosts.forEach((host) => {
          this.updateCacheEntry(host, domainCacheEntry);
        });
      });
    }

    if (viewer.organization) {
      const {
        organization: {
          domains: { edges: organizationDomainEdges },
        },
      } = viewer;

      organizationDomainEdges.forEach(({ node: domain }) => {
        domain.hosts.forEach((host) => {
          this.updateCacheEntry(host, {
            inject: domain.inject,
            injectHud: domain.injectHud,
            injectSidebar: domain.injectSidebar,
            isGmail: domain.isGmail,
            sidebarOpen: domain.defaultOpen,
            session: domain.trackSession,
          });
        });
      });
    }

    if (viewer.user) {
      setSentryUser(viewer.user);

      const {
        user: {
          domainSettings: { edges: userDomainSettingsEdges },
        },
      } = viewer;

      userDomainSettingsEdges.forEach(({ node: settings }) => {
        settings.domain.hosts.forEach((host) => {
          // A settings.domain entry will either be a shadow domain, in which
          // case all values should be null, or not, in which case it's listed
          // in organizationDomainEdges. So we can ignore it.
          this.updateCacheFromUserSettings(host, settings);
        });
      });
    }

    this.saveCache();

    this.maybeInitialize();
  }

  private maybeRefreshQuery() {
    if (
      !this.initialized ||
      (this.lastQueryTime &&
        this.lastQueryTime + SERVER_POLL_DEBOUNCE < Date.now())
    ) {
      this.makeQuery();
    }
  }

  public setForHost(host: string, open: boolean) {
    // Only do the optimistic update
    this.updateCacheFromUserSettings(host, { open, injectHud: null });
    this.saveCache();
  }
}
