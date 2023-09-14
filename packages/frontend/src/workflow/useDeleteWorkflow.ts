import { useCallback } from 'react';

import { gql, useMutation } from '@apollo/client';

import { KenchiErrorFragment, WorkflowFragment } from '../graphql/fragments';
import {
  DeleteWorkflowMutation,
  DeleteWorkflowMutationVariables,
  WorkflowFragment as WorkflowFragmentType,
} from '../graphql/generated';
import { trackEvent } from '../utils/analytics';
import useConfirm from '../utils/useConfirm';

const DELETE_WORKFLOW = gql`
  mutation DeleteWorkflowMutation($id: ID!) {
    modify: deleteWorkflow(id: $id) {
      error {
        ...KenchiErrorFragment
      }
      workflow {
        ...WorkflowFragment
      }
    }
  }
  ${WorkflowFragment}
  ${KenchiErrorFragment}
`;

export const useDeleteWorkflow = (
  workflow: WorkflowFragmentType | null,
  onDelete?: () => void
) => {
  const [confirm, ConfirmDialog] = useConfirm();
  const [deleteWorkflow, deleteWorkflowResult] = useMutation<
    DeleteWorkflowMutation,
    DeleteWorkflowMutationVariables
  >(DELETE_WORKFLOW);

  const maybeDeleteWorkflow = useCallback(async () => {
    if (!workflow || deleteWorkflowResult.loading) {
      return;
    }
    if (
      await confirm('Are you sure you want to archive this playbook?', {
        textForConfirmButton: 'Archive',
      })
    ) {
      const res = await deleteWorkflow({ variables: { id: workflow.id } });
      if (res.data?.modify.workflow) {
        trackEvent({
          category: 'workflows',
          action: 'delete',
          label: 'Delete playbook',
          object: res.data.modify.workflow.staticId,
        });
        onDelete?.();
      }
    }
  }, [
    workflow,
    deleteWorkflowResult.loading,
    confirm,
    deleteWorkflow,
    onDelete,
  ]);

  return [maybeDeleteWorkflow, ConfirmDialog, deleteWorkflowResult] as const;
};
