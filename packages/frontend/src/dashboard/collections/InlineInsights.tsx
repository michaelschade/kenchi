import { useMemo } from 'react';

import { css } from '@emotion/react';
import tw from 'twin.macro';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import {
  aggregateRatings,
  RatingsGroupRow,
  RatingsOverall,
} from '../../insights/useRatingsInsights';
import { formatNumber, pluralize } from '../../utils';
import { Sparkline } from './InsightsChart';

export function UsageCell({ usage }: { usage?: number | null }) {
  let content;
  if (usage === undefined) {
    content = <LoadingSpinner />;
  } else if (!usage) {
    content = <em>None</em>;
  } else {
    content = formatNumber(usage);
  }
  return <td css={tw`text-sm text-right`}>{content}</td>;
}

type CSATCellProps = {
  ratings?: RatingsOverall;
  hasUsage: boolean;
};

export function CSATCell({ ratings, hasUsage }: CSATCellProps) {
  if (!ratings) {
    return <td>{hasUsage ? <LoadingSpinner /> : null}</td>;
  }

  let ratingsCell;
  if (ratings) {
    if (ratings.count > 0) {
      ratingsCell = (
        <Tooltip
          placement="right"
          mouseEnterDelay={0}
          overlay={pluralize(ratings.count, 'rating')}
        >
          <span>{ratings.value}%</span>
        </Tooltip>
      );
    } else {
      ratingsCell = <em>None</em>;
    }
  } else {
    ratingsCell = null;
  }
  return <td css={tw`text-sm text-right pl-0!`}>{ratingsCell}</td>;
}

type CSATChartCellProps = {
  ratings?: RatingsGroupRow[];
  ratingsLabels: string[];
  overallAverage?: number;
  hasUsage: boolean;
};

export function CSATChartCell({
  ratings,
  ratingsLabels,
  overallAverage,
  hasUsage,
}: CSATChartCellProps) {
  if (!ratings) {
    return <td colSpan={2}>{hasUsage ? <LoadingSpinner /> : null}</td>;
  }

  let ratingsCell;
  if (ratings) {
    if (ratings.length > 0) {
      const { value, count } = aggregateRatings(ratings);
      ratingsCell = (
        <Tooltip
          placement="right"
          mouseEnterDelay={0}
          overlay={pluralize(count, 'rating')}
        >
          <span>{value}%</span>
        </Tooltip>
      );
    } else {
      ratingsCell = <em>None</em>;
    }
  } else {
    ratingsCell = null;
  }
  return (
    <>
      <td
        css={css`
          ${tw`py-0! pr-0!`}
          width: 120px;
        `}
      >
        <RatingsTrendChart
          ratings={ratings}
          labels={ratingsLabels}
          average={overallAverage}
        />
      </td>
      <td css={tw`text-sm text-right pl-0!`}>{ratingsCell}</td>
    </>
  );
}

function RatingsTrendChart({
  ratings,
  labels,
  average,
}: {
  ratings: RatingsGroupRow[];
  labels: string[];
  average?: number;
}) {
  const ratingOptions: Highcharts.Options | null = useMemo(() => {
    const rtn: Highcharts.Options = {
      chart: {
        width: 120,
      },
      xAxis: {
        categories: labels,
        min: 0,
        max: labels.length - 1,
      },
      yAxis: {
        min: 0,
        max: 100,
        gridLineWidth: 0,
        plotLines: [
          {
            value: average,
            dashStyle: 'Dot',
            color: 'lightblue',
            width: 1,
            zIndex: 5,
          },
        ],
      },
      series: [
        {
          clip: false,
          tooltip: {
            pointFormat: '<strong>4 & 5 ratings:</strong> {point.y}%',
          },
          name: '4 & 5 ratings',
          type: 'line',
          data: ratings.map((row) => ({ y: row.value, count: row.count })),
        },
      ],
    };
    return rtn;
  }, [ratings, labels, average]);
  return <Sparkline options={ratingOptions} />;
}
