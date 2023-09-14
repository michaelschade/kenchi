import { useMemo } from 'react';

import { gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';

import {
  NotificationsQuery,
  NotificationsQueryVariables,
} from '../graphql/generated';

export const NOTIFICATIONS_QUERY = gql`
  query NotificationsQuery($active: Boolean, $first: Int!, $after: String) {
    viewer {
      user {
        id
        notifications(active: $active, first: $first, after: $after) {
          edges {
            node {
              id
              notification {
                id
                type
                relatedNode {
                  id
                  ... on VersionedNode {
                    staticId
                    branchId
                  }
                }
              }
              dismissedAt
              viewedAt
            }
          }
        }
      }
    }
  }
`;
export function useNotifications(
  variables: NotificationsQueryVariables,
  fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network'
) {
  const queryResult = useQuery<NotificationsQuery, NotificationsQueryVariables>(
    NOTIFICATIONS_QUERY,
    {
      fetchPolicy,
      nextFetchPolicy: 'cache-first',
      variables,
    }
  );

  return useMemo(
    () => ({
      ...queryResult,
      data: queryResult.data?.viewer.user?.notifications,
    }),
    [queryResult]
  );
}
