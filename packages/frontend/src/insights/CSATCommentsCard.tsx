import { css } from '@emotion/react';
import orderBy from 'lodash/orderBy';
import { DateTime } from 'luxon';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { Pill } from '@kenchi/ui/lib/Dashboard/Pill';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import {
  ColumnHeading,
  PreloadedTable,
  TableRowLink,
} from '@kenchi/ui/lib/Dashboard/Table';
import {
  SidebarCardEmptyState,
  SidebarCardLoadingContents,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import ErrorAlert from '../components/ErrorAlert';
import {
  InsightsObjectGroupingEnum,
  ToolFragment,
  WorkflowFragment,
} from '../graphql/generated';
import { useSort } from '../utils/useSort';
import { useStatePagination } from '../utils/useStatePagination';
import { useRatingDetails } from './useRatingDetails';
import { RatingsStatistic, useRatingsInsights } from './useRatingsInsights';

const COLUMN_HEADINGS: ColumnHeading[] = [
  { sortKey: 'rating', value: 'Rating' },
  'Comment',
  '', // For the chevron that appears on hovering a row
];

type CSATCommentsCardProps = {
  versionedNode: ToolFragment | WorkflowFragment;
  startDate: DateTime;
  endDate: DateTime;
};

export const CSATCommentsCard = ({
  versionedNode,
  startDate,
  endDate,
}: CSATCommentsCardProps) => {
  const {
    ratingDetails,
    loading: ratingDetailsLoading,
    error: ratingDetailsError,
  } = useRatingDetails({
    staticIds: [versionedNode.staticId],
    startDate,
    endDate,
  });

  const {
    ratings: ratingsInsights,
    loading: ratingsInsightsLoading,
    error: ratingsInsightsError,
  } = useRatingsInsights({
    staticIds: [versionedNode.staticId],
    startDate,
    endDate,
    dateGrouping: DateRangeGrouping.overall,
    objectGrouping: InsightsObjectGroupingEnum.staticId,
    statistic: RatingsStatistic.percent4or5,
  });

  const [sort, setSort] = useSort(['rating', 'desc'], {
    namespace: 'ratings',
  });
  const [page, setPage, PaginationLink] = useStatePagination();

  if (
    (!ratingDetails && ratingDetailsLoading) ||
    (!ratingsInsights && ratingsInsightsLoading)
  ) {
    return (
      <ContentCard title="CSAT">
        <SidebarCardLoadingContents />
      </ContentCard>
    );
  }

  if (!ratingDetails || !ratingsInsights) {
    const loadError = ratingDetailsError || ratingsInsightsError;
    if (loadError) {
      return <ErrorAlert title="Error loading insights" error={loadError} />;
    } else {
      throw new Error('Error loading insights');
    }
  }

  const sortedRatingDetails = orderBy(ratingDetails, sort[0], sort[1]);

  return (
    <ContentCard fullBleed title="CSAT">
      {ratingDetails.length > 0 && (
        <>
          <div
            css={css`
              padding: 0.75rem;
              display: grid;
              gap: 0.5rem;
              grid-template-columns: auto 1fr;
            `}
          >
            <Pill size="large" color="blue">
              {ratingsInsights[versionedNode.staticId].value}%
            </Pill>{' '}
            <label
              css={css`
                display: grid;
                align-items: center;
                margin: 0;
                font-size: 0.9rem;
              `}
            >
              rated 4 or 5
            </label>
          </div>
          <Separator />
        </>
      )}
      <PreloadedTable
        columnHeadings={COLUMN_HEADINGS}
        data={sortedRatingDetails}
        page={page}
        PaginationLink={PaginationLink}
        rowsPerPage={3}
        onSortChange={(sort) => {
          setPage(1);
          setSort(sort);
        }}
        sort={sort}
        emptyState={
          <SidebarCardEmptyState>No recent CSAT comments</SidebarCardEmptyState>
        }
        rowRender={(ratingDetail) => {
          const ticketUrl = `https://app.intercom.com/a/apps/_/inbox/conversation/${ratingDetail.ticketId}`;
          return (
            <TableRowLink
              key={ratingDetail.ticketId}
              to={ticketUrl}
              css={css`
                font-size: 0.8rem;
              `}
            >
              <td
                css={css`
                  text-align: center;
                `}
              >
                {ratingDetail.rating}
              </td>
              <td>{ratingDetail.remark}</td>
            </TableRowLink>
          );
        }}
      />
    </ContentCard>
  );
};
