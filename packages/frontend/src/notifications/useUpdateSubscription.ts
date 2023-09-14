import { gql, useMutation } from '@apollo/client';

import { KenchiErrorFragment } from '../graphql/fragments';
import {
  UpdateSubscriptionMutation,
  UpdateSubscriptionMutationVariables,
} from '../graphql/generated';

const UPDATE_SUBSCRIPTION_MUTATION = gql`
  mutation UpdateSubscriptionMutation(
    $staticId: String!
    $subscribed: Boolean!
  ) {
    updateSubscription(staticId: $staticId, subscribed: $subscribed) {
      error {
        ...KenchiErrorFragment
      }
      versionedNode {
        id
        staticId
        branchId
        subscribed
        staticId
        branchId
      }
    }
  }

  ${KenchiErrorFragment}
`;

export function useUpdateSubscription() {
  return useMutation<
    UpdateSubscriptionMutation,
    UpdateSubscriptionMutationVariables
  >(UPDATE_SUBSCRIPTION_MUTATION);
}
