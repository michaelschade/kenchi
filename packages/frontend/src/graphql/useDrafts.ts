import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';

import { ToolListItemFragment, WorkflowListItemFragment } from './fragments';
import { DraftsQuery } from './generated';

export const DRAFTS_QUERY = gql`
  query DraftsQuery {
    viewer {
      user {
        id
        draftWorkflows(first: 100) {
          edges {
            node {
              ...WorkflowListItemFragment
            }
          }
        }
        draftTools(first: 100) {
          edges {
            node {
              ...ToolListItemFragment
            }
          }
        }
      }
    }
  }

  ${WorkflowListItemFragment}
  ${ToolListItemFragment}
`;

export default function useDrafts() {
  // TODO: maybe expose a top-level "branches" for all branches you can view?
  const { error, loading, data } = useQuery<DraftsQuery>(DRAFTS_QUERY, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const drafts = useMemo(() => {
    return [
      ...(data?.viewer.user?.draftTools.edges.map((t) => t.node) || []),
      ...(data?.viewer.user?.draftWorkflows.edges.map((w) => w.node) || []),
    ];
  }, [data]);

  return {
    drafts,
    loading,
    error,
  };
}
