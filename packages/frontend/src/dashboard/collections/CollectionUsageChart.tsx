import { useMemo } from 'react';

import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import { DateTime } from 'luxon';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import ErrorAlert from '../../components/ErrorAlert';
import {
  InsightsObjectGroupingEnum,
  InsightsTypeEnum,
} from '../../graphql/generated';
import { useUsageInsights } from '../../insights/useUsageInsights';
import { CHART_HEIGHT, FullChart } from './InsightsChart';

type UsageProps = {
  collectionId: string;
  start: DateTime;
  end: DateTime;
  type: InsightsTypeEnum.toolUsage | InsightsTypeEnum.workflowUsage;
  dataTitle: string;
  dateGrouping: Exclude<DateRangeGrouping, DateRangeGrouping.overall>;
};

const CollectionUsageChart = ({
  collectionId,
  start,
  end,
  type,
  dataTitle,
  dateGrouping,
}: UsageProps) => {
  const { usage, labels, partialIndex, loading, error } = useUsageInsights({
    collectionIds: [collectionId],
    type,
    startDate: start,
    endDate: end,
    dateGrouping,
    objectGrouping: InsightsObjectGroupingEnum.collectionId,
  });

  const collectionUsage = usage?.[collectionId];

  const chartOptions = useMemo<Highcharts.Options>(
    () => ({
      chart: { height: CHART_HEIGHT },
      title: { text: 'Usage' },
      xAxis: { categories: labels, min: 0, max: labels.length - 1 },
      yAxis: {
        title: { text: dataTitle },
        min: minBy(collectionUsage || [], 'count')?.count || 0,
        max: maxBy(collectionUsage || [], 'count')?.count || 100,
        labels: {
          style: { visibility: collectionUsage ? 'visible' : 'hidden' },
        },
      },
      series: [
        {
          type: 'line',
          name: dataTitle,
          data: collectionUsage?.map((row) => row.count),
          colorIndex: 0,
          id: collectionUsage ? 'data' : 'placeholder',
          zoneAxis: 'x',
          zones: [
            { value: partialIndex ?? labels.length },
            {
              valueForTooltip: partialIndex ?? labels.length,
              dashStyle: 'Dot',
            },
          ],
        },
      ],
    }),
    [collectionUsage, labels, partialIndex, dataTitle]
  );

  if (!usage) {
    if (error) {
      return <ErrorAlert title="Error loading insights" error={error} />;
    } else if (!loading) {
      throw new Error('Error loading insights');
    }
  }

  return (
    <ContentCard fullBleed>
      <FullChart options={chartOptions} loading={loading} />
    </ContentCard>
  );
};

export default CollectionUsageChart;
