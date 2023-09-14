import { useCallback, useEffect, useMemo } from 'react';

import { gql, useMutation } from '@apollo/client';

import { errorFromMutation } from '../../graphql/errorFromMutation';
import { KenchiErrorFragment, ToolFragment } from '../../graphql/fragments';
import {
  CreateToolMutation,
  CreateToolMutationVariables,
  SetShortcutsMutation,
  SetShortcutsMutationVariables,
  ToolCreateInput,
  ToolFragment as ToolFragmentType,
} from '../../graphql/generated';
import useList from '../../list/useList';
import { MUTATION as SET_SHORTCUTS } from '../../shortcuts/useSetShortcuts';
import { addToListCache } from '../../utils/versionedNode';

export const CREATE_TOOL = gql`
  mutation CreateToolMutation($toolData: ToolCreateInput!) {
    modify: createTool(toolData: $toolData) {
      error {
        ...KenchiErrorFragment
      }
      tool {
        ...ToolFragment
      }
    }
  }
  ${ToolFragment}
  ${KenchiErrorFragment}
`;

export const useCreateTool = (onCreate: (tool: ToolFragmentType) => void) => {
  const { forceSync } = useList();
  const [createTool, creationMutationResult] = useMutation<
    CreateToolMutation,
    CreateToolMutationVariables
  >(CREATE_TOOL, {
    update(cache, { data }) {
      const tool = data?.modify.tool;
      if (tool) {
        addToListCache(cache, tool);
        forceSync();
      }
    },
  });

  const [setShortcuts, setShortcutsResult] = useMutation<
    SetShortcutsMutation,
    SetShortcutsMutationVariables
  >(SET_SHORTCUTS);

  // Because we fire off a few mutations on save, we need to wait until they all
  // complete before we can call `onCreate` which navigates us away.
  useEffect(() => {
    const shortcutsCompleted = setShortcutsResult.called
      ? setShortcutsResult.data?.modify.orgShortcut ||
        setShortcutsResult.data?.modify.userShortcut
      : true;

    if (
      creationMutationResult.called &&
      creationMutationResult.data?.modify.tool &&
      shortcutsCompleted
    ) {
      return onCreate(creationMutationResult.data?.modify.tool);
    }
  }, [
    creationMutationResult.called,
    creationMutationResult.data,
    setShortcutsResult.called,
    setShortcutsResult.data,
    onCreate,
  ]);

  const modify = useCallback(
    async (
      toolData: ToolCreateInput,
      orgShortcut?: string | null,
      userShortcut?: string | null
    ) => {
      const res = await createTool({ variables: { toolData } });
      const tool = res.data?.modify.tool;
      if (tool) {
        if (orgShortcut !== undefined || userShortcut !== undefined) {
          await setShortcuts({
            variables: {
              staticId: tool.staticId,
              orgShortcut,
              userShortcut,
            },
          });
        }
      }
    },
    [createTool, setShortcuts]
  );

  const modifyResult = useMemo(() => {
    return {
      loading: setShortcutsResult.loading || creationMutationResult.loading,
      error:
        errorFromMutation(setShortcutsResult) ||
        errorFromMutation(creationMutationResult),
    };
  }, [setShortcutsResult, creationMutationResult]);

  return [modify, modifyResult] as const;
};
