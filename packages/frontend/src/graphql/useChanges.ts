import { useMemo } from 'react';

import { gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';

import { isTool, isWorkflow } from '../utils/versionedNode';
import {
  MajorChangesQuery,
  MajorChangesQueryVariables,
  NodeChangesQuery,
  NodeChangesQueryVariables,
  VersionFragment,
} from './generated';

const VERSION_FRAGMENT = gql`
  fragment VersionFragment on VersionedNode {
    id
    staticId
    branchId
    createdAt
    majorChangeDescription
    isFirst
    isArchived
    createdByUser {
      id
      email
      name
      givenName
      familyName
      picture
    }
  }
`;

const MAJOR_CHANGES_QUERY = gql`
  query MajorChangesQuery(
    $productFirst: Int!
    $productAfter: String
    $workflowFirst: Int!
    $workflowAfter: String
    $toolFirst: Int!
    $toolAfter: String
  ) {
    viewer {
      productChanges(first: $productFirst, after: $productAfter)
        @connection(key: "productChanges") {
        edges {
          cursor
          node {
            id
            title
            description
            createdAt
          }
        }
        pageInfo {
          hasNextPage
        }
      }
      user {
        id
        majorToolChanges(first: $toolFirst, after: $toolAfter)
          @connection(key: "toolChanges") {
          edges {
            cursor
            node {
              name
              description
              ...VersionFragment
            }
          }
        }
        majorWorkflowChanges(first: $workflowFirst, after: $workflowAfter)
          @connection(key: "workflowChanges") {
          edges {
            cursor
            node {
              name
              description
              ...VersionFragment
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
  }

  ${VERSION_FRAGMENT}
`;

const NODE_CHANGES_QUERY = gql`
  query NodeChangesQuery(
    $staticId: String!
    $onlyMajor: Boolean!
    $first: Int!
    $after: String
  ) {
    viewer {
      user {
        id
        notifications(staticId: $staticId, active: true, first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    }
    versionedNode(staticId: $staticId) {
      id
      staticId
      branchId
      ... on Workflow {
        publishedVersionsWorkflow: publishedVersions(
          onlyMajor: $onlyMajor
          first: $first
          after: $after
        ) {
          edges {
            node {
              ...VersionFragment
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
      ... on Tool {
        publishedVersionsTool: publishedVersions(
          onlyMajor: $onlyMajor
          first: $first
          after: $after
        ) {
          edges {
            node {
              ...VersionFragment
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }

  ${VERSION_FRAGMENT}
`;

export function useMajorChanges(
  variables: MajorChangesQueryVariables,
  fetchPolicy: WatchQueryFetchPolicy = 'cache-first'
) {
  const { loading, error, data, fetchMore } = useQuery<
    MajorChangesQuery,
    MajorChangesQueryVariables
  >(MAJOR_CHANGES_QUERY, {
    fetchPolicy,
    notifyOnNetworkStatusChange: true,
    variables,
  });

  const collapsedData = useMemo(() => {
    if (!data || !data.viewer.user) {
      return null;
    }
    return {
      productChanges: data.viewer.productChanges,
      majorToolChanges: data.viewer.user.majorToolChanges,
      majorWorkflowChanges: data.viewer.user.majorWorkflowChanges,
    };
  }, [data]);

  return useMemo(
    () => ({ loading, error, data: collapsedData, fetchMore }),
    [loading, error, collapsedData, fetchMore]
  );
}

export function useNodeChanges(
  variables: NodeChangesQueryVariables,
  fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network'
) {
  const { data, ...rest } = useQuery<
    NodeChangesQuery,
    NodeChangesQueryVariables
  >(NODE_CHANGES_QUERY, {
    fetchPolicy,
    variables,
  });

  const parsedData = useMemo(() => {
    let parsedData = null;
    const node = data?.versionedNode;
    if (node) {
      let publishedVersions: VersionFragment[];
      let publishedVersionsPageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      if (isWorkflow(node)) {
        publishedVersions = node.publishedVersionsWorkflow.edges.map(
          (e) => e.node
        );
        publishedVersionsPageInfo = node.publishedVersionsWorkflow.pageInfo;
      } else if (isTool(node)) {
        publishedVersions = node.publishedVersionsTool.edges.map((e) => e.node);
        publishedVersionsPageInfo = node.publishedVersionsTool.pageInfo;
      } else {
        // TODO: spaces changes
        publishedVersions = [];
        publishedVersionsPageInfo = { hasNextPage: false, endCursor: null };
      }
      parsedData = {
        publishedVersions,
        publishedVersionsPageInfo,
      };
    }
    return parsedData;
  }, [data]);

  return useMemo(() => ({ data: parsedData, ...rest }), [parsedData, rest]);
}
