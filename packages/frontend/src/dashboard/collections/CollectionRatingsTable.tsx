import { Fragment, useMemo } from 'react';

import { css } from '@emotion/react';
import type { ListIteratee } from 'lodash';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';
import { DateTime } from 'luxon';
import tw from 'twin.macro';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import {
  ColumnHeading,
  CSVExport,
  PreloadedTable,
  RawTable,
} from '@kenchi/ui/lib/Dashboard/Table';
import {
  filterConfig,
  filterData,
  NumberRange,
  RangeFilter,
  TableFilter,
  TextInputFilter,
  textInputFilterByKey,
} from '@kenchi/ui/lib/Dashboard/TableFilter';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { StyledLink } from '@kenchi/ui/lib/StyledLink';

import ErrorAlert from '../../components/ErrorAlert';
import {
  GroupedRatingsDetails,
  useRatingDetails,
} from '../../insights/useRatingDetails';
import { trackEvent } from '../../utils/analytics';
import { useFilterStates } from '../../utils/useFilterStates';
import { useSort } from '../../utils/useSort';
import { useStatePagination } from '../../utils/useStatePagination';
import {
  TableContainer,
  TitleAndActionsContainer,
} from './CollectionContentTable';

const INTERCOM_TICKET_URL_BASE =
  'https://app.intercom.com/a/apps/_/inbox/conversation/';

type Props = {
  collectionId: string;
  collectionName: string;
  startDate: DateTime;
  endDate: DateTime;
};

const COLUMN_HEADINGS: ColumnHeading[] = [
  { sortKey: 'created', value: 'Ticket' },
  { sortKey: 'rating', value: 'Rating' },
  'Comment',
  'Snippets / Playbooks Used',
];
const NOT_SORTABLE_COLUMN_HEADINGS: ColumnHeading[] = COLUMN_HEADINGS.map((v) =>
  typeof v === 'object' && 'value' in v ? v.value : v
);

const SORT_ITERATEE: Record<string, ListIteratee<GroupedRatingsDetails>> = {
  created: 'ticketCreatedAt',
  rating: ['rating', 'ticketCreatedAt'],
};

const FILTER_CONFIGS = {
  comment: filterConfig({
    name: 'Comment',
    component: TextInputFilter,
    extraProps: { placeholder: 'Comment', ariaLabel: 'Search by comment' },
    filterFn: textInputFilterByKey('remark'),
  }),
  rating: filterConfig({
    name: 'Rating',
    component: RangeFilter,
    extraProps: { min: 1, max: 5, step: 1 },
    filterFn: (items: GroupedRatingsDetails, filterValue?: NumberRange) =>
      !!filterValue &&
      items.rating >= filterValue[0] &&
      items.rating <= filterValue[1],
  }),
};

const CollectionRatingsRow = ({ data }: { data: GroupedRatingsDetails }) => {
  // TODO: maybe get APP ID via Intercom API /me and store it? _ seems to work...
  const activityByFirstPerformance = Object.values(
    groupBy(sortBy(data.activity, 'activityPerformedAt'), 'staticId')
  ).map(([first]) => first);

  return (
    <tr key={data.ticketId}>
      <td>
        <StyledLink
          to={`${INTERCOM_TICKET_URL_BASE}${data.ticketId}`}
          css={css`
            font-size: 0.8rem;
          `}
        >
          {DateTime.fromISO(data.ticketCreatedAt).toFormat('LLL d h:MM a')}
        </StyledLink>
      </td>
      <td>{data.rating}</td>
      <td>{data.remark}</td>
      <td>
        {activityByFirstPerformance.map((item, i) => (
          <Fragment key={i}>
            {i > 0 ? ', ' : ''}
            <StyledLink
              to={`/dashboard/${
                item.type === 'tool' ? 'snippets' : 'playbooks'
              }/${item.staticId}`}
            >
              {item.name}
            </StyledLink>
          </Fragment>
        ))}
      </td>
    </tr>
  );
};

const CollectionRatingsTable = ({
  collectionId,
  collectionName,
  startDate,
  endDate,
}: Props) => {
  const [sort, setSort] = useSort(['created', 'desc'], {
    namespace: 'ratings',
  });
  const [page, setPage, PaginationLink] = useStatePagination();
  const { filterStates, setFilterStates, syncFilterStatesToQueryParams } =
    useFilterStates(FILTER_CONFIGS, {
      shouldSyncWithQueryParams: true,
      queryParamNamespace: 'ratings',
      setPage,
    });

  const {
    ratingDetails,
    loading: ratingDetailsLoading,
    error: ratingDetailsError,
  } = useRatingDetails({
    collectionIds: [collectionId],
    startDate,
    endDate,
  });

  const fitleredSortedRatingDetails = useMemo(() => {
    const filteredData = filterData(
      ratingDetails || [],
      filterStates,
      FILTER_CONFIGS
    );
    return orderBy(filteredData, SORT_ITERATEE[sort[0]], [sort[1]]);
  }, [filterStates, ratingDetails, sort]);

  const renderCsvRow = (ratingDetails: GroupedRatingsDetails) => [
    `${INTERCOM_TICKET_URL_BASE}${ratingDetails.ticketId}`,
    ratingDetails.rating,
    ratingDetails.remark || '',
    ratingDetails.activity
      .map(
        (item) =>
          `${process.env.REACT_APP_HOST}/dashboard/${item.type}s/${item.staticId}`
      )
      .join(' '),
  ];

  const csvFileName = `Kenchi collection ${collectionName} ratings ${startDate.toFormat(
    'yyyy-MM-dd'
  )} to ${endDate.toFormat('yyyy-MM-dd')}.csv`;

  if (!ratingDetails) {
    if (ratingDetailsError) {
      return (
        <ErrorAlert title="Error loading insights" error={ratingDetailsError} />
      );
    } else if (!ratingDetailsLoading) {
      throw new Error('Error loading insights');
    }
  }

  let contents;
  if (ratingDetails && ratingDetails.length > 0) {
    contents = (
      <PreloadedTable
        data={fitleredSortedRatingDetails}
        page={page}
        PaginationLink={PaginationLink}
        rowComponent={CollectionRatingsRow}
        rowsPerPage={10}
        size="sm"
        columnHeadings={COLUMN_HEADINGS}
        sort={sort}
        onSortChange={(sort) => {
          setPage(1);
          setSort(sort);
        }}
      />
    );
  } else {
    contents = (
      <RawTable size="sm" columnHeadings={NOT_SORTABLE_COLUMN_HEADINGS}>
        <tbody>
          <tr className="unstyled">
            <td
              colSpan={4}
              css={({ colors }) => css`
                ${tw`p-8 text-center text-base`}
                color: ${colors.gray[10]};
              `}
            >
              {ratingDetailsLoading ? (
                <LoadingSpinner />
              ) : (
                'No ratings for this time period.'
              )}
            </td>
          </tr>
        </tbody>
      </RawTable>
    );
  }

  return (
    <TableContainer>
      <TitleAndActionsContainer>
        <TableFilter
          configs={FILTER_CONFIGS}
          states={filterStates}
          onChange={(states) => {
            trackEvent({
              category: 'collection_ratings_table',
              action: 'set_filter',
              label: 'Set filter',
              filterStates: states,
            });
            setFilterStates(states);
          }}
          onClose={syncFilterStatesToQueryParams}
        />
        <CSVExport
          data={fitleredSortedRatingDetails}
          renderRow={renderCsvRow}
          columnHeadings={COLUMN_HEADINGS}
          fileName={csvFileName}
          disabled={ratingDetailsLoading}
          onClickExport={() =>
            trackEvent({
              category: 'collection_ratings_table',
              action: 'download_csv',
              label: 'Download CSV',
            })
          }
        />
      </TitleAndActionsContainer>
      <ContentCard fullBleed>{contents}</ContentCard>
    </TableContainer>
  );
};

export default CollectionRatingsTable;
