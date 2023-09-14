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

import { ToolDiff } from '../../components/Diff';
import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { errorFromMutation } from '../../graphql/errorFromMutation';
import { KenchiErrorFragment, ToolFragment } from '../../graphql/fragments';
import {
  MergeToolMutation,
  MergeToolMutationVariables,
  MergeToolQuery,
  MergeToolQueryVariables,
  ToolFragment as ToolFragmentType,
  ToolUpdateInput,
} from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';
import { isTool } from '../../utils/versionedNode';
import ToolEditor from '../edit/ToolEditor';

const MERGE_WORKFLOW = gql`
  mutation MergeToolMutation(
    $fromId: ID!
    $toId: ID
    $toolData: ToolUpdateInput!
  ) {
    modify: mergeTool(fromId: $fromId, toId: $toId, toolData: $toolData) {
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

export const QUERY = gql`
  query MergeToolQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      ...ToolFragment
      ... on Tool {
        branchedFrom {
          ...ToolFragment
          publishedVersions(first: 1) {
            edges {
              node {
                ...ToolFragment
              }
            }
          }
        }
      }
    }
  }
  ${ToolFragment}
`;

export default function MergeWorkflow() {
  const { branchId } = useParams<{ branchId: string }>();
  const history = useHistory();

  const { loading, error, data } = useQuery<
    MergeToolQuery,
    MergeToolQueryVariables
  >(QUERY, {
    variables: { staticId: branchId },
    fetchPolicy: 'cache-and-network',
  });

  const [mergeWorkflowMutation, mergeStatus] = useMutation<
    MergeToolMutation,
    MergeToolMutationVariables
  >(MERGE_WORKFLOW, {
    onCompleted: (data) => data?.modify.tool && onUpdate(data.modify.tool),
  });

  const tool =
    data?.versionedNode && isTool(data.versionedNode)
      ? data.versionedNode
      : null;

  if (!tool) {
    if (loading) {
      return <Loading name="merge tool" />;
    } else if (error) {
      return <ErrorAlert title="Error loading snippet" error={error} />;
    } else {
      captureMessage('Snippet not found');
      return <NotFoundAlert title="Snippet not found" />;
    }
  }

  const latestPublishedTool =
    tool.branchedFrom?.publishedVersions.edges[0].node;
  const mergeConflict =
    tool.branchedFrom &&
    latestPublishedTool &&
    latestPublishedTool.id !== tool.branchedFrom.id;

  const updateTool = (toolData: ToolUpdateInput) => {
    if (!tool) {
      return;
    }
    mergeWorkflowMutation({
      variables: { fromId: tool.id, toId: latestPublishedTool?.id, toolData },
    });
  };

  const onUpdate = (tool: ToolFragmentType) => {
    trackEvent({
      category: 'tools',
      action: 'merge',
      label: 'Merge suggested edit with changes',
      object: tool.staticId,
    });
    history.push(`/snippets/${tool.staticId}`);
  };

  const onBack = () => {
    trackEvent({
      category: 'tools',
      action: 'cancel_merge',
      label: 'Canceled manually merging a tool',
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
        <ToolDiff from={tool.branchedFrom} to={tool} />
        <hr />

        {mergeConflict && latestPublishedTool && (
          <>
            <h2>Changes to snippet since then:</h2>
            <ToolDiff from={tool.branchedFrom} to={latestPublishedTool} />
            <hr />
          </>
        )}

        <ToolEditor
          tool={mergeConflict ? latestPublishedTool : tool}
          onSubmit={updateTool}
          onBack={onBack}
          submitLoading={mergeStatus.loading}
          editType="publishOnly"
        />
        <ErrorAlert
          title="Error updating snippet"
          error={errorFromMutation(mergeStatus)}
          style={css({ marginTop: '10px' })}
        />
      </ContentContainer>
    </>
  );
}
