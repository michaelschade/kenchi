import { useCallback, useMemo } from 'react';

import { gql, MutationHookOptions, useMutation } from '@apollo/client';

import { errorFromMutation } from '../../graphql/errorFromMutation';
import {
  KenchiErrorFragment,
  SpaceEditorFragment,
} from '../../graphql/fragments';
import {
  CreateSpaceMutation,
  CreateSpaceMutationVariables,
  SpaceCreateInput,
  SpaceEditorFragment as SpaceEditorFragmentType,
} from '../../graphql/generated';

const CREATE_MUTATION = gql`
  mutation CreateSpaceMutation($data: SpaceCreateInput!) {
    modify: createSpace(spaceData: $data) {
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

export const useCreateSpace = (
  onCreate: (space: SpaceEditorFragmentType) => void
) => {
  const mutationOptions: Pick<MutationHookOptions, 'onCompleted'> = {
    onCompleted: (data) => data.modify.space && onCreate(data.modify.space),
  };

  const [create, createStatus] = useMutation<
    CreateSpaceMutation,
    CreateSpaceMutationVariables
  >(CREATE_MUTATION, mutationOptions);

  const createSpace = useCallback(
    (spaceData: SpaceCreateInput) => {
      create({
        variables: {
          data: spaceData,
        },
      });
    },
    [create]
  );

  const mutationLoading = createStatus.loading;
  const mutationError = errorFromMutation(createStatus);

  const resultForCreate = useMemo(() => {
    return {
      error: mutationError,
      loading: mutationLoading,
    };
  }, [mutationError, mutationLoading]);

  return [createSpace, resultForCreate] as const;
};
