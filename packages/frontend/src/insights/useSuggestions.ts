import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';

import { UserAvatarFragment } from '../graphql/fragments';
import {
  SuggestionsForVersionedNodeQuery,
  SuggestionsForVersionedNodeQueryVariables,
} from '../graphql/generated';
import { isTool, isWorkflow } from '../utils/versionedNode';

const SUGGESTIONS_QUERY = gql`
  query SuggestionsForVersionedNodeQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      id
      staticId
      branchId
      ... on Tool {
        suggestions: branches(branchType: suggestion, first: 1000) {
          edges {
            node {
              ...SuggestionsItemFragment
              name
              icon
            }
          }
        }
      }
      ... on Workflow {
        suggestions: branches(branchType: suggestion, first: 1000) {
          edges {
            node {
              ...SuggestionsItemFragment
              name
              icon
            }
          }
        }
      }
    }
  }
  fragment SuggestionsItemFragment on VersionedNode {
    id
    staticId
    branchId
    createdAt
    isArchived
    createdByUser {
      ...UserAvatarFragment
    }
  }
  ${UserAvatarFragment}
`;

export const useSuggestions = (staticId?: string) => {
  const { loading, error, data } = useQuery<
    SuggestionsForVersionedNodeQuery,
    SuggestionsForVersionedNodeQueryVariables
  >(SUGGESTIONS_QUERY, {
    fetchPolicy: 'cache-and-network',
    skip: !staticId,
    variables: { staticId: staticId || '' },
  });
  const versionedNode =
    data?.versionedNode &&
    (isTool(data.versionedNode) || isWorkflow(data.versionedNode))
      ? data.versionedNode
      : undefined;

  const suggestions = useMemo(
    () =>
      versionedNode?.suggestions.edges
        .map((edge) => edge.node)
        .filter((suggestion) => !suggestion.isArchived) || [],
    [versionedNode]
  );

  return { loading, error, suggestions };
};
