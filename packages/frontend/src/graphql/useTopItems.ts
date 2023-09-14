import { useMemo } from 'react';

import { gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';

import { TopItemsQuery } from './generated';

export const TOP_ITEMS_QUERY = gql`
  query TopItemsQuery {
    viewer {
      user {
        id
        topUsedToolStaticIds
        topViewedWorkflowStaticIds
      }
    }
  }
`;

export default function useTopItems({
  fetchPolicy = 'cache-first',
}: {
  fetchPolicy?: WatchQueryFetchPolicy;
} = {}) {
  const { error, loading, data } = useQuery<TopItemsQuery>(TOP_ITEMS_QUERY, {
    fetchPolicy,
    nextFetchPolicy:
      fetchPolicy === 'cache-and-network' ? 'cache-first' : fetchPolicy,
    context: { noBatch: true },
  });

  const topUsedToolStaticIds = data?.viewer.user?.topUsedToolStaticIds;
  const topViewedWorkflowStaticIds =
    data?.viewer.user?.topViewedWorkflowStaticIds;

  const topMap = useMemo(() => {
    const rtn: Record<string, number> = {};
    (data?.viewer.user?.topUsedToolStaticIds || []).forEach(
      (staticId, i) => (rtn[staticId] = i)
    );
    (data?.viewer.user?.topViewedWorkflowStaticIds || []).forEach(
      (staticId, i) => (rtn[staticId] = i)
    );
    return rtn;
  }, [data]);

  return {
    topUsedToolStaticIds,
    topViewedWorkflowStaticIds,
    topMap,
    loading,
    error,
  };
}
