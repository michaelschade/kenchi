import { useCallback, useMemo } from 'react';

import { gql, MutationHookOptions, useMutation } from '@apollo/client';

import { errorFromMutation } from '../../graphql/errorFromMutation';
import {
  KenchiErrorFragment,
  SpaceEditorFragment,
} from '../../graphql/fragments';
import {
  SpaceEditorFragment as SpaceEditorFragmentType,
  SpaceUpdateInput,
  UpdateSpaceMutation,
  UpdateSpaceMutationVariables,
} from '../../graphql/generated';

const UPDATE_MUTATION = gql`
  mutation UpdateSpaceMutation($id: ID!, $data: SpaceUpdateInput!) {
    modify: updateSpace(id: $id, spaceData: $data) {
      error {
        ...KenchiErrorFragment
      }
      space {
        ...SpaceEditorFragment
      }
    }
  }
  ${KenchiErrorFragment}
  ${SpaceEditorFragment}
`;

export const useModifySpace = (
  space: SpaceEditorFragmentType | null,
  onUpdate: (space: SpaceEditorFragmentType) => void
) => {
  const mutationOptions: Pick<MutationHookOptions, 'onCompleted'> = {
    onCompleted: (data) => data.modify.space && onUpdate(data.modify.space),
  };

  const [update, updateStatus] = useMutation<
    UpdateSpaceMutation,
    UpdateSpaceMutationVariables
  >(UPDATE_MUTATION, mutationOptions);

  const modifySpace = useCallback(
    (spaceData: SpaceUpdateInput) => {
      if (!space) {
        return;
      }
      update({
        variables: {
          id: space.id,
          data: spaceData,
        },
      });
    },
    [space, update]
  );

  const mutationLoading = updateStatus.loading;
  const mutationError = errorFromMutation(updateStatus);

  const resultForModify = useMemo(() => {
    return {
      error: mutationError,
      loading: mutationLoading,
    };
  }, [mutationError, mutationLoading]);

  return [modifySpace, resultForModify] as const;
};
