import { useMemo } from 'react';

import { gql, useMutation } from '@apollo/client';

import { errorFromMutation } from '../graphql/errorFromMutation';
import { KenchiErrorFragment, WorkflowFragment } from '../graphql/fragments';
import {
  BranchTypeEnum,
  PublishWorkflowMutation,
  PublishWorkflowMutationVariables,
  UpdateWorkflowMutation,
  UpdateWorkflowMutationVariables,
  WorkflowCreateInput,
  WorkflowFragment as WorkflowFragmentType,
  WorkflowUpdateInput,
} from '../graphql/generated';

// Used only for publishing a draft for the first time
const PUBLISH_WORKFLOW = gql`
  mutation PublishWorkflowMutation(
    $id: ID!
    $workflowData: WorkflowUpdateInput!
  ) {
    modify: mergeWorkflow(fromId: $id, workflowData: $workflowData) {
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

const UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflowMutation(
    $id: ID!
    $workflowData: WorkflowUpdateInput!
  ) {
    modify: updateWorkflow(id: $id, workflowData: $workflowData) {
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

export const useModifyWorkflow = (
  workflow: WorkflowFragmentType | null,
  onUpdate: (workflow: WorkflowFragmentType) => void
) => {
  const [updateWorkflowMutation, updateMutationResult] = useMutation<
    UpdateWorkflowMutation,
    UpdateWorkflowMutationVariables
  >(UPDATE_WORKFLOW, {
    onCompleted: (data) =>
      data.modify.workflow && onUpdate(data.modify.workflow),
  });

  const [publishWorkflowMutation, publishMutationResult] = useMutation<
    PublishWorkflowMutation,
    PublishWorkflowMutationVariables
  >(PUBLISH_WORKFLOW, {
    onCompleted: (data) =>
      data.modify.workflow && onUpdate(data.modify.workflow),
  });

  const modify = (workflowData: WorkflowUpdateInput | WorkflowCreateInput) => {
    if (!workflow) {
      return;
    }
    const isDraft = workflow?.branchType === BranchTypeEnum.draft;
    if (isDraft && workflowData.branchType === BranchTypeEnum.published) {
      publishWorkflowMutation({ variables: { id: workflow.id, workflowData } });
    } else {
      updateWorkflowMutation({ variables: { id: workflow.id, workflowData } });
    }
  };

  const modifyResult = useMemo(() => {
    return {
      loading: updateMutationResult.loading || publishMutationResult.loading,
      error:
        errorFromMutation(updateMutationResult) ||
        errorFromMutation(publishMutationResult),
    };
  }, [updateMutationResult, publishMutationResult]);

  return [modify, modifyResult] as const;
};
