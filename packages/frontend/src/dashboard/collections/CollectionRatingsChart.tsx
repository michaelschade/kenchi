import { useMemo } from 'react';

import { DateTime } from 'luxon';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import ErrorAlert from '../../components/ErrorAlert';
import { InsightsObjectGroupingEnum } from '../../graphql/generated';
import {
  RatingsStatistic,
  useRatingsInsights,
} from '../../insights/useRatingsInsights';
import { CHART_HEIGHT, FullChart, pointFormatter } from './InsightsChart';

type ChartProps = {
  collectionId: string;
  startDate: DateTime;
  endDate: DateTime;
  statistic: RatingsStatistic;
  dateGrouping: Exclude<DateRangeGrouping, DateRangeGrouping.overall>;
};

type Details = {
  dataTitle: string;
  yMin: number;
  yMax: number;
  decimalPoints: number;
};

const STATISTICS: Record<RatingsStatistic, Details> = {
  average: {
    dataTitle: 'Average rating',
    yMin: 1,
    yMax: 5,
    decimalPoints: 1,
  },
  percent4or5: {
    dataTitle: '% 4 or 5 ratings',
    yMin: 0,
    yMax: 100,
    decimalPoints: 0,
  },
};

const CollectionRatingsChart = ({
  collectionId,
  startDate,
  endDate,
  statistic,
  dateGrouping,
}: ChartProps) => {
  const { ratings, labels, partialIndex, loading, error } = useRatingsInsights({
    collectionIds: [collectionId],
    startDate,
    endDate,
    dateGrouping,
    objectGrouping: InsightsObjectGroupingEnum.collectionId,
    statistic: RatingsStatistic.percent4or5,
  });

  const collectionRatings = ratings?.[collectionId];

  const chartOptions = useMemo<Highcharts.Options>(
    () => ({
      chart: { height: CHART_HEIGHT },
      title: { text: 'CSAT' },
      plotOptions: {
        series: {
          tooltip: {
            pointFormatter: pointFormatter(
              STATISTICS[statistic].decimalPoints,
              '%'
            ),
          },
        },
      },
      xAxis: {
        categories: labels,
        min: 0,
        max: labels.length - 1,
      },
      yAxis: {
        title: { text: STATISTICS[statistic].dataTitle },
        min: STATISTICS[statistic].yMin,
        max: STATISTICS[statistic].yMax,
        tickAmount: 5,
      },
      series: [
        {
          type: 'line',
          name: STATISTICS[statistic].dataTitle,
          data: collectionRatings?.map((row) => ({
            y: row.value,
            count: row.count,
          })),
          colorIndex: 0,
          id: collectionRatings ? 'data' : 'placeholder',
          zoneAxis: 'x',
          zones: [
            { value: partialIndex || labels.length },
            {
              valueForTooltip: partialIndex || labels.length,
              dashStyle: 'Dot',
            },
          ],
        },
      ],
    }),
    [labels, collectionRatings, statistic, partialIndex]
  );

  if (!ratings) {
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

export default CollectionRatingsChart;
