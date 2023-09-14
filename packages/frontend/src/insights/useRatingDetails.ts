import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';
import { DateTime } from 'luxon';

import { KenchiErrorFragment } from '../graphql/fragments';
import {
  RatingDetailsQuery,
  RatingDetailsQueryVariables,
} from '../graphql/generated';
import { BaseProps } from './types';

export const QUERY = gql`
  query RatingDetailsQuery(
    $collectionIds: [ID!]
    $staticIds: [ID!]
    $startDate: String
    $endDate: String
  ) {
    insights: insightsRatingDetails(
      collectionIds: $collectionIds
      staticIds: $staticIds
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

type RawRatingsDetails = {
  ticketId: string;
  ticketCreatedAt: string;
  rating: number;
  remark: string | null;
  type: 'tool' | 'workflow';
  activityPerformedAt: string;
  staticId: string;
  name: string;
};

export type GroupedRatingsDetails = {
  ticketId: string;
  ticketCreatedAt: string;
  rating: number;
  remark: string | null;
  activity: {
    type: 'tool' | 'workflow';
    activityPerformedAt: string;
    staticId: string;
    name: string;
  }[];
};

export type Variables = Omit<RatingDetailsQueryVariables, keyof BaseProps> &
  BaseProps;

export const useRatingDetails = (variables: Variables) => {
  const rawQueryResult = useQuery<
    RatingDetailsQuery,
    RatingDetailsQueryVariables
  >(QUERY, {
    variables: {
      ...variables,
      startDate: variables.startDate?.toFormat('yyyy-MM-dd'),
      endDate: variables.endDate?.toFormat('yyyy-MM-dd'),
    },
    fetchPolicy: 'cache-first',
  });

  const queryResult = useMemo(() => {
    const latestDataString = rawQueryResult.data?.insights.latestData;
    return {
      latestData: latestDataString ? DateTime.fromISO(latestDataString) : null,
      insights: rawQueryResult.data?.insights,
      ...rawQueryResult,
    };
  }, [rawQueryResult]);

  const ratingDetails = useMemo(() => {
    if (!queryResult.data) {
      return undefined;
    }
    const data: RawRatingsDetails[] = queryResult.data.insights.data;

    const groupedData: Record<string, GroupedRatingsDetails> = {};
    data?.forEach((d) => {
      if (!groupedData[d.ticketId]) {
        groupedData[d.ticketId] = {
          ticketId: d.ticketId,
          ticketCreatedAt: d.ticketCreatedAt,
          rating: d.rating,
          remark: d.remark,
          activity: [],
        };
      }
      groupedData[d.ticketId].activity.push({
        activityPerformedAt: d.activityPerformedAt,
        staticId: d.staticId,
        name: d.name,
        type: d.type,
      });
    });

    return Object.values(groupedData);
  }, [queryResult.data]);

  return {
    ratingDetails,
    loading: queryResult.loading,
    error: queryResult.error || queryResult.data?.insights.error,
  };
};
