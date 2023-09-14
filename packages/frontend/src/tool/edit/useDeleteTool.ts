import { useCallback } from 'react';

import { gql, useMutation } from '@apollo/client';

import { KenchiErrorFragment, ToolFragment } from '../../graphql/fragments';
import {
  DeleteToolMutation,
  DeleteToolMutationVariables,
  ToolFragment as ToolFragmentType,
} from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';
import useConfirm from '../../utils/useConfirm';

const DELETE_TOOL = gql`
  mutation DeleteToolMutation($id: ID!) {
    modify: deleteTool(id: $id) {
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

export const useDeleteTool = (
  tool: ToolFragmentType | null,
  onDelete?: () => void
) => {
  const [confirm, ConfirmDialog] = useConfirm();
  const [deleteTool, deleteToolResult] = useMutation<
    DeleteToolMutation,
    DeleteToolMutationVariables
  >(DELETE_TOOL);

  const maybeDeleteTool = useCallback(async () => {
    if (!tool || deleteToolResult.loading) {
      return;
    }
    if (
      await confirm('Are you sure you want to archive this snippet?', {
        textForConfirmButton: 'Archive',
      })
    ) {
      const res = await deleteTool({ variables: { id: tool.id } });
      if (res.data?.modify.tool) {
        trackEvent({
          category: 'tools',
          action: 'delete',
          label: 'Delete snippet',
          object: res.data.modify.tool.staticId,
        });
        onDelete?.();
      }
    }
  }, [tool, deleteToolResult.loading, confirm, deleteTool, onDelete]);

  return [maybeDeleteTool, ConfirmDialog, deleteToolResult] as const;
};
