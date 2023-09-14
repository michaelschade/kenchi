import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { captureMessage } from '@sentry/react';
import orderBy from 'lodash/orderBy';
import { DateTime } from 'luxon';
import tw from 'twin.macro';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable, TableRowLink } from '@kenchi/ui/lib/Dashboard/Table';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { SuggestionsQuery } from '../../graphql/generated';
import { useOrgName } from '../../graphql/useSettings';
import { isWorkflow } from '../../utils/versionedNode';

const QUERY = gql`
  query SuggestionsQuery {
    viewer {
      user {
        id
        collections(first: 1000) {
          edges {
            node {
              id
              workflowSuggestions(first: 1000) {
                edges {
                  node {
                    ...SuggestionFragment
                    name
                    branchedFrom {
                      id
                      publishedVersions(first: 1) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
              toolSuggestions(first: 1000) {
                edges {
                  node {
                    ...SuggestionFragment
                    name
                    component
                    branchedFrom {
                      id
                      publishedVersions(first: 1) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  fragment SuggestionFragment on VersionedNode {
    id
    staticId
    createdAt
    createdByUser {
      id
      name
      email
    }
    branchId
    branchType
  }
`;

type CollectionNode = NonNullable<
  SuggestionsQuery['viewer']['user']
>['collections']['edges'][number]['node'];
type ToolSuggestion = NonNullable<
  CollectionNode['toolSuggestions']
>['edges'][number]['node'];
type WorkflowSuggestion = NonNullable<
  CollectionNode['workflowSuggestions']
>['edges'][number]['node'];

type SuggestionRowProps = {
  suggestion: ToolSuggestion | WorkflowSuggestion;
};

const SuggestionRow = ({ suggestion }: SuggestionRowProps) => {
  const name =
    suggestion.branchedFrom?.publishedVersions.edges[0].node.name ||
    suggestion.name;
  const objectType = isWorkflow(suggestion) ? 'playbook' : 'snippet';
  const suggestionType = suggestion.branchedFrom
    ? `update ${objectType}`
    : `create ${objectType}`;

  return (
    <TableRowLink to={`/dashboard/suggestions/${suggestion.branchId}`}>
      <td>{name}</td>
      <td>{suggestionType}</td>
      <td>{DateTime.fromISO(suggestion.createdAt).toRelative()}</td>
      <td>{suggestion.createdByUser.name || suggestion.createdByUser.email}</td>
    </TableRowLink>
  );
};

const Suggestions = () => {
  const { loading, error, data } = useQuery<SuggestionsQuery>(QUERY, {
    fetchPolicy: 'network-only',
  });

  const suggestions = useMemo(() => {
    if (!data?.viewer.user) {
      return null;
    }
    const unsorted = data.viewer.user.collections.edges
      .flatMap((e) => [
        ...(e.node.toolSuggestions?.edges || []),
        ...(e.node.workflowSuggestions?.edges || []),
      ])
      .map((e) => e.node);
    return orderBy(unsorted, 'createdAt', 'desc');
  }, [data]);

  if (loading) {
    return <LoadingSpinner name="dashboard list suggestions" />;
  } else if (error) {
    return <ErrorAlert title="Error loading suggestion" error={error} />;
  } else if (!suggestions) {
    captureMessage('Error loading suggestion');
    return <NotFoundAlert title="Error loading suggestion" />;
  }

  if (suggestions.length === 0) {
    return <p>You have no suggestions to review</p>;
  }

  return (
    <ContentCard
      fullBleed={true}
      css={css`
        max-width: 800px;
      `}
    >
      <RawTable>
        <thead>
          <tr css={tw`whitespace-nowrap`}>
            <th>Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Submitted by</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {suggestions.map((suggestion) => (
            <SuggestionRow key={suggestion.id} suggestion={suggestion} />
          ))}
        </tbody>
      </RawTable>
    </ContentCard>
  );
};

export default function SuggestionsPage() {
  const orgName = useOrgName() || 'your organization';
  return (
    <PageContainer
      meta={{ title: 'Suggestions' }}
      heading="Suggestions"
      subheading={`Proposed changes to ${orgName}'s playbooks and snippets`}
      width="xl"
    >
      <Suggestions />
    </PageContainer>
  );
}
