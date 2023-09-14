import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';

import { ToolListItemFragment } from '../../graphql/fragments';
import { ToolDraftsQuery } from '../../graphql/generated';

export const TOOL_DRAFTS_QUERY = gql`
  query ToolDraftsQuery {
    viewer {
      user {
        id
        draftTools(first: 1000) {
          edges {
            node {
              ...ToolListItemFragment
            }
          }
        }
      }
    }
  }

  ${ToolListItemFragment}
`;

export default function useToolDrafts() {
  const { error, loading, data } = useQuery<ToolDraftsQuery>(
    TOOL_DRAFTS_QUERY,
    {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  );

  const drafts = useMemo(() => {
    return data?.viewer.user?.draftTools.edges.map((t) => t.node) || [];
  }, [data]);

  return {
    drafts,
    loading,
    error,
  };
}
