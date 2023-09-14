import {
  ApolloError,
  gql,
  useQuery,
  WatchQueryFetchPolicy,
} from '@apollo/client';

import { WorkflowFragment } from '../graphql/fragments';
import {
  WorkflowFragment as WorkflowFragmentType,
  WorkflowQuery,
  WorkflowQueryVariables,
} from '../graphql/generated';
import { isWorkflow } from '../utils/versionedNode';

export const QUERY = gql`
  query WorkflowQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      ...WorkflowFragment
    }
  }
  ${WorkflowFragment}
`;

export default function useWorkflow(
  staticId?: string,
  fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network'
): {
  loading: boolean;
  error: ApolloError | undefined;
  workflow: WorkflowFragmentType | null;
} {
  const { loading, error, data } = useQuery<
    WorkflowQuery,
    WorkflowQueryVariables
  >(QUERY, {
    fetchPolicy,
    variables: { staticId: staticId || '' },
    skip: !staticId,
  });

  if (!staticId) {
    return {
      loading: false,
      error: undefined,
      workflow: null,
    };
  }

  let workflow = null;
  if (data?.versionedNode && isWorkflow(data.versionedNode)) {
    workflow = data.versionedNode;
  }

  return { loading, error, workflow };
}
