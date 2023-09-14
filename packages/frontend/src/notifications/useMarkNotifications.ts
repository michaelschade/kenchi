import { useCallback } from 'react';

import { gql, useMutation } from '@apollo/client';

import { KenchiErrorFragment } from '../graphql/fragments';
import {
  MarkNotificationsMutation,
  MarkNotificationsMutationVariables,
} from '../graphql/generated';
import { SPACE_NOTIFICATIONS_VARIABLES } from './SpaceNotifications';
import { NOTIFICATIONS_QUERY } from './useNotifications';

const MARK_NOTIFICATIONS_MUTATION = gql`
  mutation MarkNotificationsMutation(
    $viewed: Boolean!
    $staticId: String
    $types: [NotificationTypeEnum!]
    $userNotificationIds: [ID!]
  ) {
    markUserNotifications(
      viewed: $viewed
      staticId: $staticId
      types: $types
      userNotificationIds: $userNotificationIds
    ) {
      error {
        ...KenchiErrorFragment
      }
      userNotifications {
        id
        viewedAt
        dismissedAt
        notification {
          id
          relatedNode {
            id
            ... on VersionedNode {
              hasActiveNotifications
            }
          }
        }
      }
    }
  }

  ${KenchiErrorFragment}
`;

export function useMarkNotifications() {
  const [mutate, status] = useMutation<
    MarkNotificationsMutation,
    MarkNotificationsMutationVariables
  >(MARK_NOTIFICATIONS_MUTATION);

  const mark = useCallback(
    (variables: MarkNotificationsMutationVariables) => {
      if (status.loading) {
        return;
      }
      mutate({
        variables,
        refetchQueries: [
          {
            query: NOTIFICATIONS_QUERY,
            variables: SPACE_NOTIFICATIONS_VARIABLES,
          },
        ],
      });
    },
    [mutate, status.loading]
  );

  return [mark, status] as const;
}
