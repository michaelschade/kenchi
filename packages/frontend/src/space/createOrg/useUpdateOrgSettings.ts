import { MutationHookOptions, useMutation } from '@apollo/client';
import gql from 'graphql-tag';

import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  UpdateOrgSettingsMutation,
  UpdateOrgSettingsMutationVariables,
} from '../../graphql/generated';

const UPDATE_SETTINGS_MUTATION = gql`
  mutation UpdateOrgSettingsMutation(
    $name: String
    $useGoogleDomain: Boolean
    $collectionsToShare: [ID!]
  ) {
    modify: updateOrganization(
      name: $name
      useGoogleDomain: $useGoogleDomain
      collectionsToShare: $collectionsToShare
    ) {
      error {
        ...KenchiErrorFragment
      }
      organization {
        id
        name
        googleDomain
      }
    }
  }

  ${KenchiErrorFragment}
`;

export default function useUpdateOrgSettings(
  options?: MutationHookOptions<
    UpdateOrgSettingsMutation,
    UpdateOrgSettingsMutationVariables
  >
) {
  return useMutation<
    UpdateOrgSettingsMutation,
    UpdateOrgSettingsMutationVariables
  >(UPDATE_SETTINGS_MUTATION, options);
}
