import { MutationHookOptions, useMutation } from '@apollo/client';
import gql from 'graphql-tag';

import { KenchiErrorFragment } from '../../graphql/fragments';
import { CreateOrgMutation } from '../../graphql/generated';

const CREATE_ORG_MUTATION = gql`
  mutation CreateOrgMutation {
    modify: createOrganization {
      error {
        ...KenchiErrorFragment
      }
      sharedCollection {
        id
      }
      viewer {
        organization {
          id
        }
      }
    }
  }

  ${KenchiErrorFragment}
`;

export default function useCreateOrg(
  options?: MutationHookOptions<CreateOrgMutation>
) {
  return useMutation<CreateOrgMutation>(CREATE_ORG_MUTATION, options);
}
