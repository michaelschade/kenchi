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

export type UsageGroupRow = {
  group: DateTime;
  count: number;
};

type Props<T = DateRangeGrouping> = BaseProps & {
  type: InsightsTypeEnum.toolUsage | InsightsTypeEnum.workflowUsage;
  objectGrouping: InsightsObjectGroupingEnum;
  dateGrouping: T;
};

type Return<T = DateRangeGrouping> = BaseReturn<T> & {
  usage?: T extends DateRangeGrouping.overall
    ? Record<string, number>
    : Record<string, UsageGroupRow[]>;
};

type RawInsightsRow = {
  grouping: string;
  day: string;
  count: number;
};

function useUsageInsights<T extends DateRangeGrouping>(
  props: Props<T>
): Return<T>;
function useUsageInsights({ dateGrouping, ...variables }: Props): Return {
  const rawInsights = useRawInsights(variables);

  const [labels, partialIndex] = useLabels({
    dateGrouping,
    latestData: rawInsights.latestData,
    startDate: variables.startDate,
    endDate: variables.endDate,
  });

  const usage = useMemo(() => {
    if (!rawInsights.insights) {
      return undefined;
    }
    const typedData = (rawInsights.insights.data || []) as RawInsightsRow[];
    if (dateGrouping === DateRangeGrouping.overall) {
      const overallUsage: Record<string, number> = {};
      typedData.forEach((row) => {
        if (!overallUsage[row.grouping]) {
          overallUsage[row.grouping] = 0;
        }
        overallUsage[row.grouping] += row.count;
      });
      return overallUsage;
    } else {
      const groupedUsage: Record<string, UsageGroupRow[]> = {};
      const dates: DateTime[] = [];
      for (
        var i = variables.startDate;
        i < variables.endDate;
        i = i.plus({ [dateGrouping]: 1 })
      ) {
        dates.push(i);
      }
      typedData.forEach((row) => {
        if (!groupedUsage[row.grouping]) {
          groupedUsage[row.grouping] = dates.map((date) => ({
            group: date,
            count: 0,
          }));
        }

        const date = DateTime.fromFormat(row.day, 'yyyy-MM-dd');
        const idx =
          sortedLastIndexBy<{ group: DateTime }>(
            groupedUsage[row.grouping],
            { group: date },
            'group'
          ) - 1;
        if (idx >= 0) {
          groupedUsage[row.grouping][idx].count += row.count;
        } else {
          captureMessage('Got usage row before start date', {
            extra: {
              row,
              startDate: groupedUsage[row.grouping][0].group.toISO(),
            },
          });
        }
      });
      return groupedUsage;
    }
  }, [
    rawInsights.insights,
    dateGrouping,
    variables.startDate,
    variables.endDate,
  ]);

  return useMemo(() => {
    const { insights, error, ...rest } = rawInsights;
    return {
      usage,
      labels,
      partialIndex,
      error: error || insights?.error || undefined,
      ...rest,
    };
  }, [rawInsights, usage, labels, partialIndex]);
}

export { useUsageInsights };
