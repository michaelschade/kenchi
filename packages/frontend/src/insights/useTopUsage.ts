import { gql, useQuery } from '@apollo/client';
import { DateTime } from 'luxon';

import { UserAvatarFragment } from '../graphql/fragments';
import {
  ToolWithTopUsageQuery,
  ToolWithTopUsageQueryVariables,
} from '../graphql/generated';
import { isTool } from '../utils/versionedNode';

const QUERY = gql`
  query ToolWithTopUsageQuery(
    $staticId: String!
    $startDate: String!
    $endDate: String!
  ) {
    versionedNode(staticId: $staticId) {
      ... on ToolLatest {
        id
        staticId
        branchId
        topUsage(first: 1000, startDate: $startDate, endDate: $endDate) {
          edges {
            count
            node {
              ...UserAvatarFragment
            }
          }
        }
      }
    }
  }
  ${UserAvatarFragment}
`;

export const useTopUsage = ({
  startDate,
  endDate,
  staticId,
}: {
  staticId: string;
  startDate: DateTime;
  endDate: DateTime;
}) => {
  const { loading, error, data } = useQuery<
    ToolWithTopUsageQuery,
    ToolWithTopUsageQueryVariables
  >(QUERY, {
    fetchPolicy: 'cache-first',
    variables: {
      startDate: startDate.toFormat('yyyy-MM-dd'),
      endDate: endDate.toFormat('yyyy-MM-dd'),
      staticId,
    },
  });
  const tool =
    data?.versionedNode && isTool(data.versionedNode)
      ? data.versionedNode
      : undefined;

  return { loading, error, topUsage: tool?.topUsage.edges };
};
