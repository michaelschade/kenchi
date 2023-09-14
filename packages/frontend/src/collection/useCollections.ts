import { useMemo } from 'react';

import { gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';

import { CollectionFragment } from '../graphql/fragments';
import {
  CollectionFragment as CollectionFragmentType,
  CollectionsQuery,
} from '../graphql/generated';

export type Collection = CollectionFragmentType;

export const QUERY = gql`
  query CollectionsQuery {
    viewer {
      user {
        id
        collections(first: 1000) {
          edges {
            node {
              ...CollectionFragment
            }
          }
        }
      }
    }
  }
  ${CollectionFragment}
`;

export default function useCollections(
  fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network'
) {
  const { loading, error, data, refetch } = useQuery<CollectionsQuery>(QUERY, {
    fetchPolicy,
  });

  const collections = useMemo(
    () => data?.viewer.user?.collections.edges.map((e) => e.node) || null,
    [data]
  );

  return { loading, error, collections, refetch };
}
