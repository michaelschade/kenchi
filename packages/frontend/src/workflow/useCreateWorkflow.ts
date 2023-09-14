import { useMemo } from 'react';

import { gql, useMutation } from '@apollo/client';

import { errorFromMutation } from '../graphql/errorFromMutation';
import { KenchiErrorFragment, WorkflowFragment } from '../graphql/fragments';
import {
  CreateWorkflowMutation,
  CreateWorkflowMutationVariables,
  WorkflowCreateInput,
  WorkflowFragment as WorkflowFragmentType,
} from '../graphql/generated';
import useList from '../list/useList';
import { addToListCache } from '../utils/versionedNode';

const CREATE_WORKFLOW = gql`
  mutation CreateWorkflowMutation($workflowData: WorkflowCreateInput!) {
    modify: createWorkflow(workflowData: $workflowData) {
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

export const useCreateWorkflow = (
  onCreate: (workflow: WorkflowFragmentType) => void
) => {
  const { forceSync } = useList();
  const [createWorkflowMutation, createWorkflowStatus] = useMutation<
    CreateWorkflowMutation,
    CreateWorkflowMutationVariables
  >(CREATE_WORKFLOW, {
    update(cache, { data }) {
      const workflow = data?.modify.workflow;
      if (workflow) {
        addToListCache(cache, workflow);
        forceSync();
      }
    },
    onCompleted(data) {
      data.modify.workflow && onCreate(data.modify.workflow);
    },
  });

  const create = (workflowData: WorkflowCreateInput) => {
    createWorkflowMutation({ variables: { workflowData } });
  };

  const creationResult = useMemo(() => {
    return {
      loading: createWorkflowStatus.loading,
      error: errorFromMutation(createWorkflowStatus),
    };
  }, [createWorkflowStatus]);

  return [create, creationResult] as const;
};
