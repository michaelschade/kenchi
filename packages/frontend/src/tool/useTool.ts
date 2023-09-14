import {
  ApolloError,
  gql,
  useQuery,
  WatchQueryFetchPolicy,
} from '@apollo/client';

import { ToolFragment } from '../graphql/fragments';
import {
  ToolFragment as ToolFragmentType,
  ToolQuery,
  ToolQueryVariables,
} from '../graphql/generated';
import { isTool } from '../utils/versionedNode';

export const QUERY = gql`
  query ToolQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      ...ToolFragment
    }
  }
  ${ToolFragment}
`;

export default function useTool(
  staticId: string,
  fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network'
): {
  loading: boolean;
  error: ApolloError | undefined;
  tool: ToolFragmentType | null;
} {
  const { loading, error, data } = useQuery<ToolQuery, ToolQueryVariables>(
    QUERY,
    {
      fetchPolicy,
      nextFetchPolicy:
        fetchPolicy === 'cache-and-network' ? 'cache-first' : undefined,
      variables: { staticId },
    }
  );

  let tool = null;
  if (data?.versionedNode && isTool(data.versionedNode)) {
    tool = data.versionedNode;
  }

  return { loading, error, tool };
}
