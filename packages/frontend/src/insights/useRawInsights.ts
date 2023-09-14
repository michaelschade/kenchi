import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';
import { DateTime } from 'luxon';

import { KenchiErrorFragment } from '../graphql/fragments';
import { InsightsQuery, InsightsQueryVariables } from '../graphql/generated';
import { BaseProps } from './types';

export const QUERY = gql`
  query InsightsQuery(
    $collectionIds: [ID!]
    $staticIds: [ID!]
    $type: InsightsTypeEnum!
    $objectGrouping: InsightsObjectGroupingEnum!
    $startDate: String
    $endDate: String
  ) {
    insights(
      collectionIds: $collectionIds
      staticIds: $staticIds
      type: $type
      objectGrouping: $objectGrouping
      startDate: $startDate
      endDate: $endDate
    ) {
      latestData
      data
      error {
        ...KenchiErrorFragment
      }
    }
  }

  ${KenchiErrorFragment}
`;

// const TIMEZONE = 'America/Los_Angeles';

export type Variables = Omit<InsightsQueryVariables, keyof BaseProps> &
  BaseProps;

export const useRawInsights = (variables: Variables) => {
  const queryResult = useQuery<InsightsQuery, InsightsQueryVariables>(QUERY, {
    variables: {
      ...variables,
      startDate: variables.startDate?.toFormat('yyyy-MM-dd'),
      endDate: variables.endDate?.toFormat('yyyy-MM-dd'),
    },
    context: { noBatch: true },
    fetchPolicy: 'cache-first',
  });

  return useMemo(() => {
    const latestDataString = queryResult.data?.insights.latestData;
    return {
      latestData: latestDataString ? DateTime.fromISO(latestDataString) : null,
      insights: queryResult.data?.insights,
      ...queryResult,
    };
  }, [queryResult]);
};
