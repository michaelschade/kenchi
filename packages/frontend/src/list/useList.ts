import { useCallback, useEffect, useMemo, useRef } from 'react';

import { gql, useQuery } from '@apollo/client';
import { captureMessage } from '@sentry/react';

import {
  CollectionListItemFragment,
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../graphql/fragments';
import {
  ListQuery,
  ListQueryVariables,
  ToolListItemFragment as ToolListItemFragmentType,
  WorkflowListItemFragment as WorkflowListItemFragmentType,
} from '../graphql/generated';
import { ListItemOrCollection } from '../search/useSearch';
import { trackSpan, trackTelemetry } from '../utils/analytics';

const MIN_SYNC_DELAY = 10 * 60 * 1000;

// Make this global across all uses of `useList`. Other option would be to use a
// context/provider to track within a tree, but being lazy for now.
let lastSuccessfulSyncTime: number | null = null;

export const LIST_QUERY = gql`
  query ListQuery(
    $since: DateTime
    $includeArchived: Boolean
    $knownCollectionIds: [ID!]
  ) {
    viewer {
      user {
        id
        collections(first: 1000) @connection(key: "listCollections") {
          edges {
            node {
              ...CollectionListItemFragment
              isPrivate
              tools(
                first: 9999
                updatedSince: $since
                includeArchived: $includeArchived
                knownCollectionIds: $knownCollectionIds
              ) @connection(key: "listTools") {
                edges {
                  node {
                    ...ToolListItemFragment
                    lastListFetch
                  }
                }
                removed
              }
              workflows(
                first: 9999
                updatedSince: $since
                includeArchived: $includeArchived
                knownCollectionIds: $knownCollectionIds
              ) @connection(key: "listWorkflows") {
                edges {
                  node {
                    ...WorkflowListItemFragment
                    lastListFetch
                  }
                }
                removed
              }
            }
          }
        }
      }
    }
  }
  ${CollectionListItemFragment}
  ${ToolListItemFragment}
  ${WorkflowListItemFragment}
  ${CollectionListItemFragment}
`;

export type ListItemType =
  | ToolListItemFragmentType
  | WorkflowListItemFragmentType;

type Collections = NonNullable<ListQuery['viewer']['user']>['collections'];

export function useFlatList(
  collections: Collections | undefined,
  itemFilter?: (item: ListItemType) => boolean
): ListItemType[] {
  return useMemo(() => {
    if (!collections) {
      return [];
    }
    const flatList = collections.edges.flatMap((e) => [
      ...e.node.tools.edges.map((e) => e.node),
      ...e.node.workflows.edges.map((e) => e.node),
    ]);
    return itemFilter ? flatList.filter(itemFilter) : flatList;
  }, [collections, itemFilter]);
}

export function useFlatListWithCollections(
  collections: Collections | undefined,
  itemFilter?: (item: ListItemOrCollection) => boolean
): ListItemOrCollection[] {
  return useMemo(() => {
    if (!collections) {
      return [];
    }
    const flatList = collections.edges.flatMap((e) => [
      ...e.node.tools.edges.map((e) => e.node),
      ...e.node.workflows.edges.map((e) => e.node),
      e.node,
    ]);
    return itemFilter ? flatList.filter(itemFilter) : flatList;
  }, [collections, itemFilter]);
}

const reduceNewest = (
  value: string | null,
  edge: { node: { lastListFetch: string } }
) => {
  if (!value || edge.node.lastListFetch > value) {
    return edge.node.lastListFetch;
  } else {
    return value;
  }
};

export default function useList() {
  const startTime = useRef<number | null>(new Date().getTime());

  const { error, loading, data, fetchMore, client } = useQuery<
    ListQuery,
    ListQueryVariables
  >(LIST_QUERY, {
    fetchPolicy: 'cache-first',
    context: { noBatch: true },
    variables: { includeArchived: false },
    notifyOnNetworkStatusChange: true,
  });
  const nextDataIsFirstNetworkFetch = useRef(loading);

  const user = data?.viewer.user;

  useEffect(() => {
    if (!nextDataIsFirstNetworkFetch.current) {
      return;
    }
    if (!loading) {
      nextDataIsFirstNetworkFetch.current = false;
      if (user) {
        lastSuccessfulSyncTime = new Date().getTime();
      }
    }
  }, [loading, user]);

  const sync = useCallback(async () => {
    if (loading) {
      return;
    }

    let since;
    let knownCollectionIds;
    if (user?.collections) {
      since = user.collections.edges.reduce<string | null>(
        (runningNewest, e) => {
          const toolsNewest = e.node.tools.edges.reduce(
            reduceNewest,
            runningNewest
          );
          return e.node.workflows.edges.reduce(reduceNewest, toolsNewest);
        },
        null
      );
      knownCollectionIds = user.collections.edges.map((e) => e.node.id);
    } else {
      if (user) {
        captureMessage('No collection after useList load', {
          extra: { user, loading, error },
        });
      }

      since = knownCollectionIds = undefined;
      // If we hit this it's most likely because we're logged out. Alternatively
      // it could be because of a cache issue. Regardless, clear the cache and
      // trigger a full refetch to make sure we don't accidentally try to merge
      // old out of date data into our new fresh data.
      const cacheKeys = Object.keys(client.cache.extract());
      const collectionKeys = cacheKeys.filter((key) =>
        key.startsWith('Collection:')
      );
      // This is probably pretty slow. The other option would be to blow away
      // the entire cache, which would be faster. Fortunately there shouldn't be
      // more than a few dozen collections in the common case, so not too
      // worried for now.
      collectionKeys.forEach((id) => {
        client.cache.evict({
          id,
          fieldName: 'tools:listTools',
          broadcast: false,
        });
        client.cache.evict({
          id,
          fieldName: 'workflows:listWorkflows',
          broadcast: false,
        });
      });
    }

    // For the voodoo magic that makes fetchMore do the right thing, check out cache.ts (mergeAndDedupe)
    const res = await fetchMore({
      variables: {
        since,
        includeArchived: !!since,
        knownCollectionIds,
      },
    });
    if (res.data.viewer.user) {
      lastSuccessfulSyncTime = new Date().getTime();
    }
  }, [user, fetchMore, loading, error, client.cache]);

  useEffect(() => {
    let type;
    let startTimeLocal: number | undefined;
    if (startTime.current) {
      type = 'initial';
      startTimeLocal = startTime.current;
      startTime.current = null;
    } else {
      type = 'subsequent';
    }
    const user = data?.viewer?.user;
    if (user?.collections === undefined) {
      const span = trackSpan(`use_list_${type}_network_load`, {
        viewer_keys: Object.keys(data?.viewer || {}).join(','),
      });
      return () => {
        span.end({
          duration_ms: startTimeLocal
            ? new Date().getTime() - startTimeLocal
            : undefined,
        });
      };
    } else {
      trackTelemetry(`use_list_${type}_cache_load`, {
        duration_ms: startTimeLocal
          ? new Date().getTime() - startTimeLocal
          : undefined,
        collections: user.collections.edges.length,
        items: user.collections.edges.reduce(
          (count, e) =>
            count + e.node.tools?.edges.length + e.node.workflows?.edges.length,
          0
        ),
      });
    }
  }, [data, startTime]);

  const suggestSync = useCallback(() => {
    // This most likely means we're currently syncing, but call sync anyway just in case
    if (!lastSuccessfulSyncTime) {
      sync();
    } else if (lastSuccessfulSyncTime + MIN_SYNC_DELAY < new Date().getTime()) {
      sync();
    }
  }, [sync]);

  return {
    collections: user?.collections,
    loading,
    forceSync: sync,
    suggestSync,
    error,
  };
}
