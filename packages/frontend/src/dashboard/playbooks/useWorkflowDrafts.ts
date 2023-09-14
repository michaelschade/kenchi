import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';

import { WorkflowListItemFragment } from '../../graphql/fragments';
import { WorkflowDraftsQuery } from '../../graphql/generated';

export const WORKFLOW_DRAFTS_QUERY = gql`
  query WorkflowDraftsQuery {
    viewer {
      user {
        id
        draftWorkflows(first: 1000) {
          edges {
            node {
              ...WorkflowListItemFragment
            }
          }
        }
      }
    }
  }

  ${WorkflowListItemFragment}
`;

export default function useWorkflowDrafts() {
  const { error, loading, data } = useQuery<WorkflowDraftsQuery>(
    WORKFLOW_DRAFTS_QUERY,
    {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  );

  const drafts = useMemo(() => {
    return data?.viewer.user?.draftWorkflows.edges.map((t) => t.node) || [];
  }, [data]);

  return {
    drafts,
    loading,
    error,
  };
}
