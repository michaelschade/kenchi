import { useMemo, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  faFileInvoice,
  faMailBulk,
  faPlusCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ListIteratee } from 'lodash';
import capitalize from 'lodash/capitalize';
import orderBy from 'lodash/orderBy';
import partition from 'lodash/partition';
import { DateTime } from 'luxon';
import { ParsedQs, stringify } from 'qs';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import {
  ColumnHeading,
  CSVExport,
  PreloadedTable,
  TableRowLink,
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
import { ContentCardTabs } from '@kenchi/ui/lib/Dashboard/Tabs';
import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import {
  InsightsObjectGroupingEnum,
  InsightsTypeEnum,
} from '../../graphql/generated';
import {
  RatingsStatistic,
  useRatingsInsights,
} from '../../insights/useRatingsInsights';
import { useUsageInsights } from '../../insights/useUsageInsights';
import { ToolHoverCard } from '../../tool/ToolHoverCard';
import { trackEvent } from '../../utils/analytics';
import { useFilterStates } from '../../utils/useFilterStates';
import { useSort } from '../../utils/useSort';
import { useStatePagination } from '../../utils/useStatePagination';
import { WorkflowHoverCard } from '../../workflow/WorkflowHoverCard';
import { CSATCell, UsageCell } from './InlineInsights';

const PER_PAGE = 10;

type ContentItemType = 'playbook' | 'snippet';

type ContentItem = {
  id: string;
  staticId: string;
  name: string;
  icon?: string | null;
  createdAt: string;
  isArchived: boolean;
};

type Props = {
  collectionId: string;
  collectionName: string;
  type: ContentItemType;
  items: ContentItem[];
  creationUrl: string;
  startDate: DateTime;
  endDate: DateTime;
  canHaveRatings?: boolean;
  queryParams?: ParsedQs;
};

// The TableContainer's min-height is a hack to avoid changing the height of the
// page as filters are applied. If we let the page height change, stuff would
// move while the customer is looking at / trying to interact with it.
export const TableContainer = styled.div`
  display: grid;
  gap: 0.5rem;
  grid-template-rows: auto auto 1fr;
  min-height: calc(100vh - 7rem);
`;

export const TitleAndActionsContainer = styled.div`
  align-items: center;
  display: grid;
  gap: 0.75rem;
  grid-auto-flow: column;
  justify-content: end;
`;

const CollectionContentTableRow = ({
  type,
  item,
  children,
  queryParams,
}: {
  type: ContentItemType;
  item: ContentItem;
  children: React.ReactNode;
  queryParams?: ParsedQs;
}) => {
  const archivedAt = item.isArchived ? DateTime.fromISO(item.createdAt) : null;
  const queryString = queryParams
    ? `?${stringify(queryParams, {
        arrayFormat: 'indices',
      })}`
    : '';

  const row = (
    <TableRowLink to={`/dashboard/${type}s/${item.staticId}${queryString}`}>
      <td>
        <NameWithEmoji
          name={item.name}
          emoji={item.icon}
          fallbackIcon={type === 'playbook' ? faFileInvoice : faMailBulk}
        />
      </td>
      <td css={tw`w-px`}>
        {archivedAt ? (
          <span
            css={({ colors }: KenchiTheme) =>
              css`
                color: ${colors.gray[10]};
                ${tw`text-sm whitespace-nowrap`}
              `
            }
            title={archivedAt.toLocaleString()}
          >
            archived {archivedAt.toRelative()}
          </span>
        ) : null}
      </td>
      {children}
    </TableRowLink>
  );

  if (type === 'playbook') {
    return (
      <WorkflowHoverCard workflowId={item.staticId} key={item.staticId}>
        {row}
      </WorkflowHoverCard>
    );
  }

  return (
    <ToolHoverCard toolId={item.staticId} key={item.staticId}>
      {row}
    </ToolHoverCard>
  );
};

export const CollectionContentTable = ({
  collectionId,
  collectionName,
  type,
  items,
  creationUrl,
  startDate,
  endDate,
  canHaveRatings,
  queryParams,
}: Props) => {
  const [selectedTab, setSelectedTab] = useState<string>('published');
  const [page, setPage, PaginationLink] = useStatePagination();

  const usageType =
    type === 'playbook'
      ? InsightsTypeEnum.workflowUsage
      : InsightsTypeEnum.toolUsage;
  const collectionIds = useMemo(() => [collectionId], [collectionId]);
  const [sort, setSort] = useSort(['name', 'asc'], {
    namespace: 'content',
  });

  const { usage } = useUsageInsights({
    collectionIds,
    type: usageType,
    startDate,
    endDate,
    dateGrouping: DateRangeGrouping.overall,
    objectGrouping: InsightsObjectGroupingEnum.staticId,
  });

  const { ratings } = useRatingsInsights({
    collectionIds,
    startDate,
    endDate,
    dateGrouping: DateRangeGrouping.overall,
    objectGrouping: InsightsObjectGroupingEnum.staticId,
    statistic: RatingsStatistic.percent4or5,
  });

  const filterConfigs = useMemo(
    () => ({
      name: filterConfig({
        name: 'Name',
        component: TextInputFilter,
        extraProps: { placeholder: 'Name', ariaLabel: 'Search by name' },
        filterFn: textInputFilterByKey('name'),
      }),
      usage: filterConfig({
        name: 'Usage',
        component: RangeFilter,
        extraProps: {
          min: 0,
          max: Object.values(usage || {}).reduce((a, b) => Math.max(a, b), 0),
        }, // TODO: disabled state while loading?
        filterFn: (item: ContentItem, filterValue?: NumberRange) => {
          if (!filterValue || !usage) {
            // Show everything if we're still loading
            return true;
          }
          if (!(item.staticId in usage)) {
            return false;
          }
          const usageValue = usage[item.staticId];
          return usageValue >= filterValue[0] && usageValue <= filterValue[1];
        },
      }),
      csat: filterConfig({
        name: 'CSAT',
        component: RangeFilter,
        extraProps: {
          min: 0,
          max: 100,
          valueSuffix: '%',
        }, // TODO: disabled state while loading?
        filterFn: (item: ContentItem, filterValue?: NumberRange) => {
          if (!filterValue || !ratings) {
            // Show everything if we're still loading
            return true;
          }
          if (!(item.staticId in ratings)) {
            return false;
          }
          const { value } = ratings[item.staticId];
          return value >= filterValue[0] && value <= filterValue[1];
        },
      }),
    }),
    [usage, ratings]
  );

  const sortedItems = orderBy(items, (item) => item.name.toLocaleLowerCase());
  const [archivedItems, nonArchivedItems] = partition(
    sortedItems,
    (item) => item.isArchived
  );

  const { filterStates, setFilterStates, syncFilterStatesToQueryParams } =
    useFilterStates(filterConfigs, {
      shouldSyncWithQueryParams: true,
      queryParamNamespace: 'content',
      setPage,
    });

  const nonArchivedFilteredItems = useMemo(
    () => filterData(nonArchivedItems, filterStates, filterConfigs),
    [nonArchivedItems, filterStates, filterConfigs]
  );

  const archivedFilteredItems = useMemo(
    () => filterData(archivedItems, filterStates, filterConfigs),
    [archivedItems, filterStates, filterConfigs]
  );

  const filteredItems =
    selectedTab === 'archived'
      ? archivedFilteredItems
      : nonArchivedFilteredItems;

  const filteredSortedItems = useMemo(() => {
    let sortIteratee: ListIteratee<ContentItem>;
    switch (sort[0]) {
      case 'name':
        sortIteratee = (item) => item.name.toLocaleLowerCase();
        break;
      case 'usage':
        sortIteratee = ({ staticId }: ContentItem) => usage?.[staticId] || 0;
        break;
      case 'csat':
        sortIteratee = ({ staticId }: ContentItem) =>
          ratings?.[staticId] ? ratings[staticId].value : -1; // Make sure unrated items are at the bottom
        break;
      default:
        throw new Error(`Unknown sort key: ${sort[0]}`);
    }
    return orderBy(filteredItems, sortIteratee, sort[1]);
  }, [filteredItems, sort, usage, ratings]);

  const columnHeadings: ColumnHeading[] = [
    { sortKey: 'name', value: 'Name' },
    '',
    { sortKey: 'usage', value: 'Usage' },
  ];
  if (canHaveRatings) {
    columnHeadings.push({
      sortKey: 'csat',
      value: 'CSAT',
      helpText: 'Percent of 4 or 5 CSAT ratings',
    });
  }
  columnHeadings.push(
    { value: 'URL', forCsvOnly: true },
    { value: 'Updated at', forCsvOnly: true },
    ''
  );

  const renderCsvRow = (item: ContentItem) => {
    const cellValues = [item.name, usage?.[item.staticId] ?? ''];
    if (canHaveRatings) {
      cellValues.push(ratings?.[item.staticId]?.value ?? '');
    }
    cellValues.push(
      `${process.env.REACT_APP_HOST}/dashboard/${type}s/${item.staticId}`,
      DateTime.fromISO(item.createdAt).toFormat('yyyy-MM-dd') // every update creates a new version
    );
    return cellValues;
  };

  const csvFileName = `Kenchi collection ${collectionName} ${type}s ${startDate.toFormat(
    'yyyy-MM-dd'
  )} to ${endDate.toFormat('yyyy-MM-dd')}.csv`;

  return (
    <TableContainer>
      <TitleAndActionsContainer>
        <TableFilter
          configs={filterConfigs}
          states={filterStates}
          onChange={(states) => {
            trackEvent({
              category: 'collection_content_table',
              action: 'set_filter',
              label: 'Set filter',
              filterStates: states,
            });
            setFilterStates(states);
          }}
          onClose={syncFilterStatesToQueryParams}
        />
        <CSVExport
          data={filteredSortedItems}
          renderRow={renderCsvRow}
          columnHeadings={columnHeadings}
          fileName={csvFileName}
          disabled={(canHaveRatings && !ratings) || !usage}
          onClickExport={() =>
            trackEvent({
              category: 'collection_content_table',
              action: 'download_csv',
              label: 'Download CSV',
            })
          }
        />
        <UnstyledLink
          to={creationUrl}
          css={css`
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-weight: 400;
          `}
        >
          <FontAwesomeIcon fixedWidth size="sm" icon={faPlusCircle} />
          New {capitalize(type)}
        </UnstyledLink>
      </TitleAndActionsContainer>
      <ContentCard fullBleed>
        <ContentCardTabs
          value={selectedTab}
          onChange={setSelectedTab}
          options={[
            {
              value: 'published',
              label: `${capitalize(type)}s`,
              count: nonArchivedFilteredItems.length,
            },
            {
              value: 'archived',
              label: 'Archived',
              count: archivedFilteredItems.length,
            },
          ]}
        />
        {filteredSortedItems.length > 0 ? (
          <PreloadedTable
            columnHeadings={columnHeadings}
            data={filteredSortedItems}
            page={page}
            PaginationLink={PaginationLink}
            sort={sort}
            onSortChange={(sort) => {
              setPage(1);
              setSort(sort);
            }}
            rowsPerPage={PER_PAGE}
            rowRender={(item) => (
              <CollectionContentTableRow
                key={item.id}
                type={type}
                item={item}
                queryParams={queryParams}
              >
                <UsageCell
                  usage={usage ? usage[item.staticId] || null : undefined}
                />
                {canHaveRatings && (
                  <CSATCell
                    hasUsage={!!usage}
                    ratings={ratings ? ratings[item.staticId] || [] : undefined}
                  />
                )}
              </CollectionContentTableRow>
            )}
            size="sm"
          />
        ) : (
          <div
            css={({ colors }) => css`
              ${tw`p-8 text-center text-base`}
              color: ${colors.gray[10]};
            `}
          >
            {selectedTab === 'archived' ? (
              <>No archived {type}s.</>
            ) : (
              <>
                No {type}s.{' '}
                <UnstyledLink to={creationUrl}>Create one?</UnstyledLink>
              </>
            )}
          </div>
        )}
      </ContentCard>
    </TableContainer>
  );
};
