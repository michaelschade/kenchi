import { ApolloError, QueryResult } from '@apollo/client';
import { DateTime } from 'luxon';

import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import { InsightsQuery, InsightsQueryVariables } from '../graphql/generated';

export type BaseProps = {
  collectionIds?: string[];
  staticIds?: string[];
  startDate: DateTime;
  endDate: DateTime;
};

export type BaseReturn<T = DateRangeGrouping> = Omit<
  QueryResult<InsightsQuery, InsightsQueryVariables>,
  'error'
> & {
  latestData: DateTime | null;
  labels: T extends DateRangeGrouping.overall ? undefined : string[];
  partialIndex?: T extends DateRangeGrouping.overall ? never : number | null;
  error?: InsightsQuery['insights']['error'] | ApolloError;
};
