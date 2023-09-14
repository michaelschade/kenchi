import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';

import {
  ToolRelatedWorkflowsQuery,
  ToolRelatedWorkflowsQueryVariables,
} from '../graphql/generated';
import { isTool } from '../utils/versionedNode';

const RELATED_WORKFLOWS_QUERY = gql`
  query ToolRelatedWorkflowsQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      staticId
      branchId
      ... on ToolLatest {
        workflows(first: 1000) {
          edges {
            node {
              id
              staticId
              branchId
              name
              icon
            }
          }
        }
      }
    }
  }
`;

// Get all workflows that contain the tool with this staticId
export const useRelatedWorkflows = (staticId?: string) => {
  const { data, loading, error } = useQuery<
    ToolRelatedWorkflowsQuery,
    ToolRelatedWorkflowsQueryVariables
  >(RELATED_WORKFLOWS_QUERY, {
    variables: { staticId: staticId || '' },
  });

  const relatedWorkflows = useMemo(() => {
    const tool = data?.versionedNode;

    // The versionedNode might actually be a space, not a tool
    if (!tool || !isTool(tool)) {
      return [];
    }
    return tool.workflows.edges.map(({ node }) => node) || [];
  }, [data]);

  return { loading, error, relatedWorkflows };
};
