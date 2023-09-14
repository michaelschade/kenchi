import { gql, MutationHookOptions, useMutation } from '@apollo/client';

import { KenchiErrorFragment, ShortcutFragment } from '../graphql/fragments';
import {
  SetShortcutsMutation,
  SetShortcutsMutationVariables,
} from '../graphql/generated';

export const MUTATION = gql`
  mutation SetShortcutsMutation(
    $staticId: String!
    $orgShortcut: String
    $userShortcut: String
  ) {
    modify: setShortcuts(
      staticId: $staticId
      orgShortcut: $orgShortcut
      userShortcut: $userShortcut
    ) {
      error {
        ...KenchiErrorFragment
      }
      orgShortcut {
        ...ShortcutFragment
      }
      userShortcut {
        ...ShortcutFragment
      }
    }
  }
  ${KenchiErrorFragment}
  ${ShortcutFragment}
`;

export default function useSetShortcuts(
  options?: MutationHookOptions<
    SetShortcutsMutation,
    SetShortcutsMutationVariables
  >
) {
  return useMutation<SetShortcutsMutation, SetShortcutsMutationVariables>(
    MUTATION,
    options
  );
}
