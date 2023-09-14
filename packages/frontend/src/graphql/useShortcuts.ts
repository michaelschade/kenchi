import { useMemo } from 'react';

import { gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';
import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';

import { ShortcutFragment } from './fragments';
import { ShortcutsQuery } from './generated';

export const SHORTCUTS_QUERY = gql`
  query ShortcutsQuery {
    viewer {
      organization {
        id
        shortcuts {
          ...ShortcutFragment
        }
      }
      user {
        id
        shortcuts {
          ...ShortcutFragment
        }
      }
    }
  }

  ${ShortcutFragment}
`;

export default function useShortcuts(
  fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network'
) {
  const { error, loading, data, refetch } = useQuery<ShortcutsQuery>(
    SHORTCUTS_QUERY,
    {
      fetchPolicy,
      nextFetchPolicy:
        fetchPolicy === 'cache-and-network' ? 'cache-first' : undefined,
      context: { noBatch: true },
    }
  );

  const organization = data?.viewer.organization?.shortcuts;
  const user = data?.viewer.user?.shortcuts;

  const byStaticId = useMemo(() => {
    const all = (organization || []).concat(user || []);
    return groupBy(all, 'staticId');
  }, [organization, user]);

  const byShortcut = useMemo(
    () => ({
      ...keyBy(organization, 'shortcut'),
      ...keyBy(user, 'shortcut'),
    }),
    [organization, user]
  );

  return {
    loading,
    error,
    organization,
    user,
    byStaticId,
    byShortcut,
    refetchQueries: [{ query: SHORTCUTS_QUERY }],
    refetch,
  };
}

export const useShortcut = (staticId: string | null | undefined) => {
  const { byStaticId, refetchQueries } = useShortcuts('cache-first');
  const shortcuts = staticId ? byStaticId[staticId] : [];

  const orgShortcut = shortcuts?.find((s) => s.orgWide)?.shortcut;
  const userShortcut = shortcuts?.find((s) => !s.orgWide)?.shortcut;

  return {
    orgShortcut,
    userShortcut,
    refetchQueries,
  };
};
