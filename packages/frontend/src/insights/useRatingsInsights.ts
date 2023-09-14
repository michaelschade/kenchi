import { useMemo } from 'react';

import { captureMessage } from '@sentry/react';
import sortedLastIndexBy from 'lodash/sortedLastIndexBy';
import { DateTime } from 'luxon';

import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import {
  InsightsObjectGroupingEnum,
  InsightsTypeEnum,
} from '../graphql/generated';
import { BaseProps, BaseReturn } from './types';
import { useLabels } from './useLabels';
import { useRawInsights } from './useRawInsights';

export type RatingsOverall = {
  value: number;
  count: number;
};

export type RatingsGroupRow = {
  group: DateTime;
  value: number;
  count: number;
};

export enum RatingsStatistic {
  average = 'average',
  percent4or5 = 'percent4or5',
}

type RatingsStatisticDetails = {
  addToTotal: (row: { rating: number; count: number }) => number;
  calc: (row: { value: number; count: number }) => number;
};

const STATISTICS: Record<RatingsStatistic, RatingsStatisticDetails> = {
  average: {
    addToTotal: ({ rating, count }) => rating * count,
    calc: ({ value, count }) => Math.round((value / count) * 100) / 100,
  },
  percent4or5: {
    addToTotal: ({ rating, count }) => (rating >= 4 ? count : 0),
    calc: ({ value, count }) => Math.round((value / count) * 100),
  },
};

export function aggregateRatings(
  data: RatingsOverall[],
  statistic: RatingsStatistic = RatingsStatistic.percent4or5
) {
  const total = data.reduce(
    (value, row) =>
      value +
      STATISTICS[statistic].addToTotal({ count: row.count, rating: row.value }),
    0
  );
  const count = data.reduce((value, row) => value + row.count, 0);
  return {
    value: STATISTICS[statistic].calc({ value: total, count }),
    count,
  };
}

type Props<T = DateRangeGrouping> = BaseProps & {
  dateGrouping: T;
  objectGrouping: InsightsObjectGroupingEnum;
  statistic: RatingsStatistic;
};

type Return<T = DateRangeGrouping> = BaseReturn<T> & {
  ratings?: T extends DateRangeGrouping.overall
    ? Record<string, RatingsOverall>
    : Record<string, RatingsGroupRow[]>;
};

type RawInsightsRow = {
  grouping: string;
  day: string;
  rating: number;
  count: number;
};

function useRatingsInsights<T extends DateRangeGrouping>(
  props: Props<T>
): Return<T>;
function useRatingsInsights({
  dateGrouping,
  statistic,
  ...variables
}: Props): Return {
  const rawInsights = useRawInsights({
    type: InsightsTypeEnum.ratings,
    ...variables,
  });

  const [labels, partialIndex] = useLabels({
    dateGrouping,
    latestData: rawInsights.latestData,
    startDate: variables.startDate,
    endDate: variables.endDate,
  });

  const ratings = useMemo(() => {
    if (!rawInsights.insights?.data) {
      return undefined;
    }
    const typedData = rawInsights.insights.data as RawInsightsRow[];
    if (dateGrouping === DateRangeGrouping.overall) {
      const overallRatings: Record<string, RatingsOverall> = {};
      typedData.forEach((row) => {
        if (!overallRatings[row.grouping]) {
          overallRatings[row.grouping] = { value: 0, count: 0 };
        }
        overallRatings[row.grouping].value +=
          STATISTICS[statistic].addToTotal(row);
        overallRatings[row.grouping].count += row.count;
      });

      Object.values(overallRatings).forEach(
        (row) => (row.value = STATISTICS[statistic].calc(row))
      );

      return overallRatings;
    } else {
      const groupedRatings: Record<string, RatingsGroupRow[]> = {};
      const dates: DateTime[] = [];
      for (
        var i = variables.startDate;
        i < variables.endDate;
        i = i.plus({ [dateGrouping]: 1 })
      ) {
        dates.push(i);
      }
      typedData.forEach((row) => {
        if (!groupedRatings[row.grouping]) {
          groupedRatings[row.grouping] = dates.map((date) => ({
            group: date,
            value: 0,
            count: 0,
          }));
        }

        const date = DateTime.fromFormat(row.day, 'yyyy-MM-dd');
        const idx =
          sortedLastIndexBy<{ group: DateTime }>(
            groupedRatings[row.grouping],
            { group: date },
            'group'
          ) - 1;

        if (idx >= 0) {
          groupedRatings[row.grouping][idx].value +=
            STATISTICS[statistic].addToTotal(row);
          groupedRatings[row.grouping][idx].count += row.count;
        } else {
          captureMessage('Got ratings row before start date', {
            extra: {
              row,
              startDate: groupedRatings[row.grouping][0].group.toISO(),
            },
          });
        }
      });

      Object.values(groupedRatings).forEach((groupValue) =>
        groupValue.forEach(
          (groupRow) => (groupRow.value = STATISTICS[statistic].calc(groupRow))
        )
      );

      return groupedRatings;
    }
  }, [
    rawInsights.insights,
    dateGrouping,
    statistic,
    variables.startDate,
    variables.endDate,
  ]);

  return useMemo(() => {
    const { insights, error, ...rest } = rawInsights;
    return {
      ratings,
      labels,
      partialIndex,
      error: error || insights?.error || undefined,
      ...rest,
    };
  }, [rawInsights, ratings, labels, partialIndex]);
}

export { useRatingsInsights };
