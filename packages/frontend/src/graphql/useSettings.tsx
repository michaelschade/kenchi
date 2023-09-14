import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { gql, useQuery } from '@apollo/client';
import { useThrottledCallback } from 'use-debounce';

import { setSessionId } from '../utils/analytics';
import { setSentryUser } from '../utils/sentry';
import { SettingsQuery } from './generated';
import { hasVisibleOrg } from './utils';

// Generally be thoughtful about putting things in here: it's loaded with every
// single page load and refreshed every 10m. Only add things that are commonly
// referenced in a lot of places, small in size, and need to be accessed as
// synchronously as possible.

export const QUERY = gql`
  query SettingsQuery {
    viewer {
      organization {
        id
        disabledMessage
        name
        hasIntercomAccessToken
        googleDomain
        shadowRecord
      }
      searchConfig {
        apiKey
        apiKeyExpiration
        appId
        indexName
        shouldUseAlgolia
        lastUpdated
      }
      session {
        id
        type
      }
      user {
        id
        email
        name
        givenName
        potentialGoogleDomain
        organizationPermissions
        wantsEditSuggestionEmails
        collections(first: 1000) {
          edges {
            node {
              id
              unwrappedPermissions
            }
          }
        }
      }
    }
  }
`;

const SettingsContext = createContext<{
  data: SettingsQuery | null;
  refetch: () => void;
} | null>(null);

export function SettingsProvider({
  children,
  fetchPolicy = 'cache-and-network',
}: {
  children: React.ReactNode;
  fetchPolicy?: 'cache-and-network' | 'cache-first';
}) {
  const { data, loading, refetch } = useQuery<SettingsQuery>(QUERY, {
    fetchPolicy,
    nextFetchPolicy: 'cache-first',
    pollInterval: 10 * 60 * 1000, // 10m
  });

  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const refetchUnlessLoading = useCallback(() => {
    if (!loadingRef.current) {
      refetch();
    }
  }, [refetch]);
  const throttledRefetch = useThrottledCallback(() => {
    refetchUnlessLoading();
  }, 10000);

  const [latestData, setLatestData] = useState<SettingsQuery | null>(
    data || null
  );

  // I *think* when there's a network error we return null instead of the
  // previously cached data. Store it to avoid that issue.
  useEffect(() => {
    if (data) {
      if (data.viewer.user) {
        setSentryUser(data.viewer.user);
      }
      if (data.viewer.session) {
        setSessionId(data.viewer.session.id);
      }
      setLatestData(data);
    }
  }, [data]);

  const value = useMemo(
    () => ({ data: latestData, refetch: throttledRefetch }),
    [latestData, throttledRefetch]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useHasOrgPermission(permission: string) {
  const settings = useSettings();
  const organizationPermissions =
    settings?.viewer.user?.organizationPermissions;
  if (!organizationPermissions) {
    return null;
  }
  return organizationPermissions.includes(permission);
}

export function useHasCollectionPermission(
  collectionId: string | null,
  permission: string
) {
  const settings = useSettings();
  const orgPermissions = settings?.viewer.user?.organizationPermissions;
  if (orgPermissions?.includes('manage_collections')) {
    return true;
  }

  const collections = settings?.viewer.user?.collections.edges;
  if (!collections || !collectionId) {
    return null;
  }
  const collection = collections.find((e) => e.node.id === collectionId);
  if (!collection) {
    return false;
  }
  return collection.node.unwrappedPermissions.includes(permission);
}

export function useHasSomeCollectionPermission(permission: string) {
  const settings = useSettings();
  const orgPermissions = settings?.viewer.user?.organizationPermissions;
  if (orgPermissions?.includes('manage_collections')) {
    return true;
  }

  return settings?.viewer.user?.collections.edges.some((e) => {
    const perms = e.node.unwrappedPermissions;
    return perms.includes(permission);
  });
}

export function useOrgName() {
  const settings = useSettings();
  return (
    (hasVisibleOrg(settings?.viewer) && settings?.viewer.organization?.name) ||
    ''
  );
}

export function useHasIntercom() {
  const settings = useSettings();
  return settings?.viewer.organization?.hasIntercomAccessToken;
}

export function useSearchConfig() {
  const settings = useSettings();
  return settings?.viewer.searchConfig;
}

export function useRefetchSettings() {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return settingsContext.refetch;
}

export default function useSettings() {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return settingsContext.data;
}
