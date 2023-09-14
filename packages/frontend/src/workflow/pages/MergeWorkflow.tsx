import { gql, useMutation, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import { captureMessage } from '@sentry/react';
import { useHistory, useParams } from 'react-router-dom';

import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import Loading from '@kenchi/ui/lib/Loading';

import { WorkflowDiff } from '../../components/Diff';
import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { KenchiErrorFragment, WorkflowFragment } from '../../graphql/fragments';
import {
  MergeWorkflowMutation,
  MergeWorkflowMutationVariables,
  MergeWorkflowQuery,
  MergeWorkflowQueryVariables,
  WorkflowFragment as WorkflowFragmentType,
  WorkflowUpdateInput,
} from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';
import { isWorkflow } from '../../utils/versionedNode';
import WorkflowEditor from '../WorkflowEditor';

const MERGE_WORKFLOW = gql`
  mutation MergeWorkflowMutation(
    $fromId: ID!
    $toId: ID
    $workflowData: WorkflowUpdateInput!
  ) {
    mergeWorkflow(fromId: $fromId, toId: $toId, workflowData: $workflowData) {
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

export const QUERY = gql`
  query MergeWorkflowQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      ...WorkflowFragment
      ... on Workflow {
        branchedFrom {
          ...WorkflowFragment
          publishedVersions(first: 1) {
            edges {
              node {
                ...WorkflowFragment
              }
            }
          }
        }
      }
    }
  }
  ${WorkflowFragment}
`;

export default function MergeWorkflow() {
  const { branchId } = useParams<{ branchId: string }>();
  const history = useHistory();

  const { loading, error, data } = useQuery<
    MergeWorkflowQuery,
    MergeWorkflowQueryVariables
  >(QUERY, {
    variables: { staticId: branchId },
    fetchPolicy: 'cache-and-network',
  });

  const [
    mergeWorkflowMutation,
    { data: mergeData, loading: mergeLoading, error: mergeError },
  ] = useMutation<MergeWorkflowMutation, MergeWorkflowMutationVariables>(
    MERGE_WORKFLOW,
    {
      onCompleted: (data) => {
        if (data?.mergeWorkflow?.workflow) {
          onUpdate(data.mergeWorkflow.workflow);
        }
      },
    }
  );

  const workflow =
    data?.versionedNode && isWorkflow(data.versionedNode)
      ? data.versionedNode
      : null;

  if (!workflow) {
    if (loading) {
      return <Loading name="merge workflow" />;
    } else if (error) {
      return <ErrorAlert title="Error loading playbook" error={error} />;
    } else {
      captureMessage('Playbooks not found');
      return <NotFoundAlert title="Playbooks not found" />;
    }
  }

  const latestPublishedWorkflow =
    workflow.branchedFrom?.publishedVersions.edges[0].node;
  const mergeConflict =
    workflow.branchedFrom &&
    latestPublishedWorkflow &&
    latestPublishedWorkflow.id !== workflow.branchedFrom.id;

  const updateWorkflow = (workflowData: WorkflowUpdateInput) => {
    if (!workflow) {
      return;
    }
    mergeWorkflowMutation({
      variables: {
        fromId: workflow.id,
        toId: latestPublishedWorkflow?.id,
        workflowData,
      },
    });
  };

  const onUpdate = (workflow: WorkflowFragmentType) => {
    trackEvent({
      category: 'workflows',
      action: 'merge',
      label: 'Merge suggested edit with changes',
      object: workflow.staticId,
    });
    history.push(`/playbooks/${workflow.staticId}`);
  };

  const onBack = () => {
    trackEvent({
      category: 'workflows',
      action: 'cancel_merge',
      label: 'Canceled manually merging a workflow',
    });
    history.goBack();
  };

  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={onBack} icon={faArrowLeft} />

        <SectionHeader>Merge playbook changes</SectionHeader>
      </HeaderBar>

      <ContentContainer>
        <h2>Changes proposed:</h2>
        <WorkflowDiff from={workflow.branchedFrom} to={workflow} />
        <hr />

        {mergeConflict && latestPublishedWorkflow && (
          <>
            <h2>Changes to playbook since then:</h2>
            <WorkflowDiff
              from={workflow.branchedFrom}
              to={latestPublishedWorkflow}
            />
            <hr />
          </>
        )}

        <WorkflowEditor
          workflow={mergeConflict ? latestPublishedWorkflow : workflow}
          onSubmit={updateWorkflow}
          onBack={onBack}
          submitLoading={mergeLoading}
          editType="publishOnly"
        />
        <ErrorAlert
          title="Error updating playbook"
          error={mergeError || mergeData?.mergeWorkflow?.error}
          style={css({ marginTop: '10px' })}
        />
      </ContentContainer>
    </>
  );
}
