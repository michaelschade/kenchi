import { useCallback, useEffect, useMemo } from 'react';

import { gql, useMutation } from '@apollo/client';

import { errorFromMutation } from '../../graphql/errorFromMutation';
import { KenchiErrorFragment, ToolFragment } from '../../graphql/fragments';
import {
  BranchTypeEnum,
  PublishToolMutation,
  PublishToolMutationVariables,
  SetShortcutsMutation,
  SetShortcutsMutationVariables,
  ToolFragment as ToolFragmentType,
  ToolUpdateInput,
  UpdateToolMutation,
  UpdateToolMutationVariables,
} from '../../graphql/generated';
import { MUTATION as SET_SHORTCUTS } from '../../shortcuts/useSetShortcuts';

// Used only for publishing a draft for the first time
const PUBLISH_TOOL = gql`
  mutation PublishToolMutation($id: ID!, $toolData: ToolUpdateInput!) {
    modify: mergeTool(fromId: $id, toolData: $toolData) {
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

export const UPDATE_TOOL = gql`
  mutation UpdateToolMutation($id: ID!, $toolData: ToolUpdateInput!) {
    modify: updateTool(id: $id, toolData: $toolData) {
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

export const useModifyTool = (
  tool: ToolFragmentType | null,
  onUpdate: (tool: ToolFragmentType) => void
) => {
  const [updateMutation, updateMutationResult] = useMutation<
    UpdateToolMutation,
    UpdateToolMutationVariables
  >(UPDATE_TOOL);

  const [publishMutation, publishMutationResult] = useMutation<
    PublishToolMutation,
    PublishToolMutationVariables
  >(PUBLISH_TOOL);

  const [setShortcuts, setShortcutsResult] = useMutation<
    SetShortcutsMutation,
    SetShortcutsMutationVariables
  >(SET_SHORTCUTS);

  // Because we fire off a few mutations on save, we need to wait until they all
  // complete before we can call `onUpdate` which navigates us away.
  useEffect(() => {
    const shortcutsCompleted = setShortcutsResult.called
      ? setShortcutsResult.data?.modify.orgShortcut ||
        setShortcutsResult.data?.modify.userShortcut
      : true;

    if (
      updateMutationResult.called &&
      updateMutationResult.data?.modify.tool &&
      shortcutsCompleted
    ) {
      return onUpdate(updateMutationResult.data?.modify.tool);
    }

    if (
      publishMutationResult.called &&
      publishMutationResult.data?.modify.tool &&
      shortcutsCompleted
    ) {
      return onUpdate(publishMutationResult.data?.modify.tool);
    }
  }, [
    updateMutationResult.called,
    updateMutationResult.data,
    publishMutationResult.called,
    publishMutationResult.data,
    setShortcutsResult.called,
    setShortcutsResult.data,
    onUpdate,
  ]);

  const modify = useCallback(
    async (
      toolData: ToolUpdateInput,
      orgShortcut?: string | null,
      userShortcut?: string | null
    ) => {
      if (!tool) {
        return;
      }

      // Only update shortcuts if we're publishing a new version
      if (
        toolData.branchType === BranchTypeEnum.published &&
        (orgShortcut !== undefined || userShortcut !== undefined)
      ) {
        const res = await setShortcuts({
          variables: {
            staticId: tool.staticId,
            orgShortcut,
            userShortcut,
          },
        });
        if (!res.data?.modify.orgShortcut && !res.data?.modify.userShortcut) {
          // Likely an error, so we won't proceed so we can display a message
          return;
        }
      }

      if (
        tool.branchType === BranchTypeEnum.draft &&
        toolData.branchType === BranchTypeEnum.published
      ) {
        publishMutation({
          variables: { id: tool.id, toolData },
        });
      } else {
        updateMutation({
          variables: { id: tool.id, toolData },
        });
      }
    },
    [tool, setShortcuts, publishMutation, updateMutation]
  );

  const modifyResult = useMemo(() => {
    return {
      loading:
        setShortcutsResult.loading ||
        updateMutationResult.loading ||
        publishMutationResult.loading,
      error:
        errorFromMutation(setShortcutsResult) ||
        errorFromMutation(updateMutationResult) ||
        errorFromMutation(publishMutationResult),
    };
  }, [setShortcutsResult, updateMutationResult, publishMutationResult]);

  return [modify, modifyResult] as const;
};
