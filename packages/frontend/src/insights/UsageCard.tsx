import { useMemo, useState } from 'react';

import { css, useTheme } from '@emotion/react';
import capitalize from 'lodash/capitalize';
import { DateTime } from 'luxon';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { Pill } from '@kenchi/ui/lib/Dashboard/Pill';
import {
  SidebarCardEmptyState,
  SidebarCardLoadingContents,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { DateRangeGrouping, rangely } from '@kenchi/ui/lib/DateRangePicker';

import { Sparkline } from '../dashboard/collections/InsightsChart';
import {
  InsightsObjectGroupingEnum,
  InsightsTypeEnum,
  ToolFragment,
  WorkflowFragment,
} from '../graphql/generated';
import { useOrgName } from '../graphql/useSettings';
import { isWorkflow } from '../utils/versionedNode';
import { UsageGroupRow, useUsageInsights } from './useUsageInsights';

type UsageCardProps = {
  versionedNode: ToolFragment | WorkflowFragment;
  startDate: DateTime;
  endDate: DateTime;
  dateGrouping: Exclude<DateRangeGrouping, DateRangeGrouping.overall>;
};

export const UsageCard = ({
  versionedNode,
  startDate,
  endDate,
  dateGrouping,
}: UsageCardProps) => {
  const { colors } = useTheme();
  const orgName = useOrgName() || 'your organization';
  const [hoveredUsageCount, setHoveredUsageCount] = useState<number | null>(
    null
  );
  const [hoveredUsageDate, setHoveredUsageDate] = useState<string | null>(null);

  const insightsType = isWorkflow(versionedNode)
    ? InsightsTypeEnum.workflowUsage
    : InsightsTypeEnum.toolUsage;

  const {
    usage,
    labels,
    loading: usageLoading,
  } = useUsageInsights({
    staticIds: [versionedNode.staticId],
    type: insightsType,
    startDate,
    endDate,
    dateGrouping,
    objectGrouping: InsightsObjectGroupingEnum.staticId,
  });

  const usageSparklineOptions: Highcharts.Options | null = useMemo(() => {
    const rtn: Highcharts.Options = {
      chart: { width: null, type: 'area' },
      xAxis: {
        categories: labels,
        min: 0,
        max: labels.length - 1,
      },
      yAxis: {
        min: 0,
        gridLineWidth: 0,
      },
      plotOptions: {
        area: {
          fillColor: colors.accentWithAlpha[5],
        },
      },
      tooltip: {
        enabled: false,
      },
      series: [
        {
          lineWidth: 2,
          states: {
            hover: {
              lineWidth: 2,
            },
          },
          marker: {
            lineWidth: 1,
            radius: 2.5,
            states: {
              hover: {
                lineWidth: 1,
                radius: 3,
              },
            },
          },
          clip: false,
          name: 'Usage',
          type: 'area',
          data: (usage?.[versionedNode.staticId] || []).map(
            (row: UsageGroupRow) => row.count
          ),
          point: {
            events: {
              mouseOver: (event) => {
                // @ts-ignore
                setHoveredUsageCount(event.target.y);
                // @ts-ignore
                setHoveredUsageDate(event.target.category);
              },
              mouseOut: () => {
                setHoveredUsageCount(null);
                setHoveredUsageDate(null);
              },
            },
          },
        },
      ],
    };
    return rtn;
  }, [labels, colors.accentWithAlpha, usage, versionedNode.staticId]);

  if (usageLoading) {
    return (
      <ContentCard title="Usage">
        <SidebarCardLoadingContents />
      </ContentCard>
    );
  }

  if (!usage?.[versionedNode.staticId]) {
    return (
      <ContentCard title="Usage" fullBleed>
        <SidebarCardEmptyState>
          Nobody at {orgName} used this{' '}
          {isWorkflow(versionedNode) ? 'playbook' : 'snippet'} between{' '}
          {startDate.toLocaleString({ month: 'short', day: 'numeric' })} and{' '}
          {endDate.toLocaleString({ month: 'short', day: 'numeric' })}.
        </SidebarCardEmptyState>
      </ContentCard>
    );
  }

  const averageUsage = Math.round(
    usage[versionedNode.staticId].reduce((acc, row) => acc + row.count, 0) /
      usage[versionedNode.staticId].length
  );

  return (
    <ContentCard title={`${capitalize(rangely[dateGrouping])} usage`}>
      <div
        css={css`
          display: grid;
          grid-template-columns: auto auto;
          justify-content: space-between;
        `}
      >
        <label
          css={({ colors }: KenchiTheme) => css`
            font-size: 0.8rem;
            font-weight: 600;
            color: ${colors.gray[11]};
            margin: 0;
          `}
        >
          {hoveredUsageDate ? hoveredUsageDate : 'Average'}
        </label>
        <div>
          <Pill size="medium" color="blue">
            {hoveredUsageCount ? hoveredUsageCount : averageUsage}
          </Pill>
        </div>
      </div>
      <div
        css={css`
          padding: 0.5rem 0.25rem 0.25rem 0.25rem;
        `}
      >
        <Sparkline options={usageSparklineOptions} />
      </div>
    </ContentCard>
  );
};
