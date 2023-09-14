import { gql, useMutation, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { captureMessage } from '@sentry/react';
import { useHistory, useParams } from 'react-router-dom';
import tw from 'twin.macro';

import {
  DangerButton,
  PrimaryButton,
  SecondaryButton,
} from '@kenchi/ui/lib/Button';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import { BranchStatusAlert } from '../../components/BranchStatus';
import {
  ListDiff,
  TextDiff,
  TextOldToNew,
  ToolDiff,
  WorkflowDiff,
} from '../../components/Diff';
import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import {
  KenchiErrorFragment,
  ToolFragment,
  WorkflowFragment,
} from '../../graphql/fragments';
import {
  AcceptToolSuggestionMutation,
  AcceptToolSuggestionMutationVariables,
  AcceptWorkflowSuggestionMutation,
  AcceptWorkflowSuggestionMutationVariables,
  RejectToolSuggestionMutation,
  RejectToolSuggestionMutationVariables,
  RejectWorkflowSuggestionMutation,
  RejectWorkflowSuggestionMutationVariables,
  ViewSuggestionQuery,
} from '../../graphql/generated';
import { PreviewRenderer } from '../../slate/Renderer';
import { isTool, isWorkflow } from '../../utils/versionedNode';

// TODO: once we make collections optional on workflows we can merge these into one query
const QUERY = gql`
  query ViewSuggestionQuery($staticId: String!) {
    workflow: versionedNode(staticId: $staticId) {
      staticId
      branchId
      ...WorkflowFragment
      ... on Workflow {
        publishedVersions(first: 1) {
          edges {
            node {
              id
            }
          }
        }
        branchedFrom {
          isLatest
          ...WorkflowFragment
        }
      }
    }
    tool: versionedNode(staticId: $staticId) {
      staticId
      branchId
      ...ToolFragment
      ... on Tool {
        publishedVersions(first: 1) {
          edges {
            node {
              id
            }
          }
        }
        branchedFrom {
          isLatest
          ...ToolFragment
        }
      }
    }
  }
  ${WorkflowFragment}
  ${ToolFragment}
`;

const ACCEPT_WORKFLOW_MUTATION = gql`
  mutation AcceptWorkflowSuggestionMutation($fromId: ID!, $toId: ID) {
    mergeWorkflow(fromId: $fromId, toId: $toId, workflowData: {branchType: published}) {
      error {
        ...KenchiErrorFragment
      }
      workflow {
        ...WorkflowFragment
      }
    }
    ${WorkflowFragment}
    ${KenchiErrorFragment}
  }
`;

const REJECT_WORKFLOW_MUTATION = gql`
  mutation RejectWorkflowSuggestionMutation($id: ID!) {
    deleteWorkflow(id: $id) {
      error {
        ...KenchiErrorFragment
      }
      workflow {
        ...WorkflowFragment
      }
    }
    ${WorkflowFragment}
    ${KenchiErrorFragment}
  }
`;

const ACCEPT_TOOL_MUTATION = gql`
  mutation AcceptToolSuggestionMutation($fromId: ID!, $toId: ID) {
    mergeTool(fromId: $fromId, toId: $toId, toolData: {branchType: published}) {
      error {
        ...KenchiErrorFragment
      }
      tool {
        ...ToolFragment
      }
    }
    ${ToolFragment}
    ${KenchiErrorFragment}
  }
`;

const REJECT_TOOL_MUTATION = gql`
  mutation RejectToolSuggestionMutation($id: ID!) {
    deleteTool(id: $id) {
      error {
        ...KenchiErrorFragment
      }
      tool {
        ...ToolFragment
      }
    }
    ${ToolFragment}
    ${KenchiErrorFragment}
  }
`;

const containerStyle = css`
  display: grid;
  grid-template-columns: minmax(250px, max-content) minmax(min-content, 300px);
  gap: 2rem;
  align-items: start;
  justify-items: stretch;
`;

const overviewStyle = ({ colors }: KenchiTheme) => css`
  display: grid;
  grid-template-columns: repeat(auto-fit, 1fr);
  gap: 0.5rem;
  font-size: 0.95em;

  dl {
    margin: 0;
  }

  dt {
    font-weight: 600;
    color: ${colors.gray[12]};
  }

  dd {
    color: ${colors.gray[11]};
  }

  dd.block {
    margin-left: 0.3rem;
    padding-left: 0.5rem;
    border-left: 1px solid hsla(210, 30%, 85%, 0.8);
  }
`;

export default function SuggestionPage() {
  const { id } = useParams<{ id: string }>();

  const history = useHistory();
  const viewSuggestionVariables = { staticId: id };
  const { loading, error, data } = useQuery<ViewSuggestionQuery>(QUERY, {
    variables: viewSuggestionVariables,
    fetchPolicy: 'cache-and-network',
  });

  const [acceptWorkflowMutation, { loading: acceptWorkflowLoading }] =
    useMutation<
      AcceptWorkflowSuggestionMutation,
      AcceptWorkflowSuggestionMutationVariables
    >(ACCEPT_WORKFLOW_MUTATION, {
      refetchQueries: [{ query: QUERY, variables: viewSuggestionVariables }],
    });
  const [rejectWorkflowMutation, { loading: rejectWorkflowLoading }] =
    useMutation<
      RejectWorkflowSuggestionMutation,
      RejectWorkflowSuggestionMutationVariables
    >(REJECT_WORKFLOW_MUTATION, {
      refetchQueries: [{ query: QUERY, variables: viewSuggestionVariables }],
    });

  const [acceptToolMutation, { loading: acceptToolLoading }] = useMutation<
    AcceptToolSuggestionMutation,
    AcceptToolSuggestionMutationVariables
  >(ACCEPT_TOOL_MUTATION, {
    refetchQueries: [{ query: QUERY, variables: viewSuggestionVariables }],
  });
  const [rejectToolMutation, { loading: rejectToolLoading }] = useMutation<
    RejectToolSuggestionMutation,
    RejectToolSuggestionMutationVariables
  >(REJECT_TOOL_MUTATION, {
    refetchQueries: [{ query: QUERY, variables: viewSuggestionVariables }],
  });

  let suggestion:
    | Extract<ViewSuggestionQuery['tool'], { __typename: 'ToolLatest' }>
    | Extract<ViewSuggestionQuery['workflow'], { __typename: 'WorkflowLatest' }>
    | null;
  let urlPrefix;
  if (data?.workflow && isWorkflow(data.workflow)) {
    urlPrefix = 'playbooks';
    suggestion = data.workflow;
  } else if (data?.tool && isTool(data.tool)) {
    urlPrefix = 'snippets';
    suggestion = data.tool;
  } else {
    urlPrefix = null;
    suggestion = null;
  }

  const acceptLoading = acceptWorkflowLoading || acceptToolLoading;
  const rejectLoading = rejectWorkflowLoading || rejectToolLoading;

  const acceptMutation = () => {
    if (!suggestion || acceptLoading || rejectLoading) {
      return;
    }

    const variables = {
      fromId: suggestion.id,
      toId: suggestion.branchedFrom?.id,
    };
    if (isWorkflow(suggestion)) {
      acceptWorkflowMutation({ variables });
    } else {
      acceptToolMutation({ variables });
    }
  };

  const rejectMutation = () => {
    if (!suggestion || acceptLoading || rejectLoading) {
      return;
    }

    const variables = { id: suggestion.id };
    if (isWorkflow(suggestion)) {
      rejectWorkflowMutation({ variables });
    } else {
      rejectToolMutation({ variables });
    }
  };

  if (loading) {
    return <LoadingSpinner name="dashboard view suggestion" />;
  } else if (error) {
    return <ErrorAlert title="Error loading suggestion" error={error} />;
  } else if (!suggestion || !urlPrefix) {
    captureMessage('Error loading suggestion');
    return <NotFoundAlert title="Error loading suggestion" />;
  }

  // If we're branched, can merge automatically if there's no branch on top of it. If fresh, can merge only if there's no published version
  const canMerge = suggestion.branchedFrom
    ? suggestion.branchedFrom.isLatest
    : suggestion.publishedVersions.edges.length === 0;
  const disabled = acceptLoading || rejectLoading;
  const editUrl = `/${urlPrefix}/${suggestion.staticId}/merge/${suggestion.branchId}`;

  const actions = [];
  if (suggestion.isArchived) {
    actions.push(<BranchStatusAlert key="alert" item={suggestion} />);
  } else {
    if (canMerge) {
      actions.push(
        <PrimaryButton
          key="accept"
          disabled={disabled}
          onClick={acceptMutation}
        >
          Accept
        </PrimaryButton>
      );
      actions.push(
        <SecondaryButton
          key="edit"
          disabled={disabled}
          onClick={() => history.push(editUrl)}
        >
          Accept & Edit
        </SecondaryButton>
      );
    } else {
      actions.push(
        <Tooltip
          key="merge"
          overlay="This Playbook has changed since this edit was suggested, so we cannot automatically apply it: you'll need to re-do the edit yourself. Apologies for the inconvience, we're working on improving this limitation."
        >
          <SecondaryButton
            disabled={disabled}
            onClick={() => history.push(editUrl)}
          >
            Manually Apply
          </SecondaryButton>
        </Tooltip>
      );
    }
    actions.push(
      <DangerButton key="reject" disabled={disabled} onClick={rejectMutation}>
        Reject
      </DangerButton>
    );
  }

  return (
    <PageContainer
      meta={{ title: `Suggestion for ${suggestion.name}` }}
      heading={
        <>
          Review {suggestion.branchedFrom ? 'changes to' : 'new playbook:'}
          &nbsp;
          <em>{suggestion.branchedFrom?.name || suggestion.name}</em>
        </>
      }
      width="lg"
    >
      <div css={containerStyle}>
        <div css={tw`grid gap-4`}>
          <ContentCard css={overviewStyle} title="Metadata">
            <dl>
              <dt>Name</dt>
              <dd>
                {suggestion.branchedFrom &&
                suggestion.branchedFrom.name !== suggestion.name ? (
                  <TextDiff
                    from={suggestion.branchedFrom.name}
                    to={suggestion.name}
                  />
                ) : (
                  suggestion.name
                )}
              </dd>

              {suggestion.__typename === 'WorkflowLatest' &&
                (suggestion.branchedFrom?.icon || suggestion.icon) && (
                  <>
                    <dt>Icon</dt>
                    <dd>
                      {
                        <TextOldToNew
                          from={suggestion.branchedFrom?.icon || ''}
                          to={suggestion.icon || ''}
                        />
                      }
                    </dd>
                  </>
                )}

              {(suggestion.branchedFrom?.collection ||
                suggestion.collection) && (
                <>
                  <dt>Collection</dt>
                  <dd>
                    {
                      <TextOldToNew
                        from={suggestion.branchedFrom?.collection?.name}
                        to={suggestion.collection?.name}
                      />
                    }
                  </dd>
                </>
              )}

              {((suggestion.branchedFrom?.keywords || []).length > 0 ||
                suggestion.keywords.length > 0) && (
                <>
                  <dt>Keywords</dt>
                  <dd>
                    {
                      <ListDiff
                        from={suggestion.branchedFrom?.keywords}
                        to={suggestion.keywords}
                      />
                    }
                  </dd>
                </>
              )}

              {(suggestion.branchedFrom?.description ||
                suggestion.description) && (
                <>
                  <dt>Description</dt>
                  <dd className="block">
                    {suggestion.branchedFrom &&
                    suggestion.branchedFrom.description !==
                      suggestion.description ? (
                      <TextDiff
                        from={suggestion.branchedFrom.description}
                        to={suggestion.description}
                      />
                    ) : (
                      suggestion.description
                    )}
                  </dd>
                </>
              )}

              {suggestion.majorChangeDescription && (
                <>
                  <dt>Alert for this change</dt>
                  <dd className="block">
                    {' '}
                    <PreviewRenderer
                      contents={suggestion.majorChangeDescription}
                    />
                  </dd>
                </>
              )}
            </dl>
          </ContentCard>

          <ContentCard title="Content">
            {isWorkflow(suggestion) ? (
              <WorkflowDiff from={suggestion.branchedFrom} to={suggestion} />
            ) : (
              <ToolDiff from={suggestion.branchedFrom} to={suggestion} />
            )}
          </ContentCard>
        </div>

        <div css={tw`sticky top-4`}>
          <ContentCard title="Actions">
            <div css={tw`grid gap-2`}>{actions}</div>
          </ContentCard>
        </div>
      </div>
    </PageContainer>
  );
}
