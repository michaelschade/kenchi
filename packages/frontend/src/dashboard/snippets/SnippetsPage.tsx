import { useEffect, useMemo } from 'react';

import { faMailBulk, faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
import { ListIteratee } from 'lodash';
import orderBy from 'lodash/orderBy';
import { DateTime } from 'luxon';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LinkWithIcon } from '@kenchi/ui/lib/Dashboard/LinkWithIcon';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import {
  ColumnHeading,
  CSVExport,
  EmptyStateContainer,
  PreloadedTable,
  TableRowLink,
} from '@kenchi/ui/lib/Dashboard/Table';
import {
  filterConfig,
  filterData,
  MultiSelectFilter,
  TableFilter,
  TextInputFilter,
  textInputFilterByKey,
} from '@kenchi/ui/lib/Dashboard/TableFilter';
import { ContentCardTabs } from '@kenchi/ui/lib/Dashboard/Tabs';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import ErrorAlert from '../../components/ErrorAlert';
import { BranchTypeEnum } from '../../graphql/generated';
import useList, { ListItemType, useFlatList } from '../../list/useList';
import { ToolHoverCard } from '../../tool/ToolHoverCard';
import { trackEvent } from '../../utils/analytics';
import { useFilterStates } from '../../utils/useFilterStates';
import { useRoutePagination } from '../../utils/useRoutePagination';
import { useSort } from '../../utils/useSort';
import { isTool } from '../../utils/versionedNode';
import useTabValue from '../useTabValue';
import useToolDrafts from './useToolDrafts';

const EmptyState = ({
  filtersAreActive,
  tabValue,
}: {
  filtersAreActive: boolean;
  tabValue: string;
}) => {
  if (filtersAreActive) {
    return (
      <EmptyStateContainer>
        No snippets match your filters.{' '}
        <UnstyledLink to="snippets">Clear filters</UnstyledLink> or{' '}
        <UnstyledLink to="snippets/new">create a new snippet</UnstyledLink>?
      </EmptyStateContainer>
    );
  }
  const items = tabValue === 'drafts' ? 'draft snippets' : 'snippets';
  return (
    <EmptyStateContainer>
      No {items}.{' '}
      <UnstyledLink to="snippets/new">Create a new snippet?</UnstyledLink>
    </EmptyStateContainer>
  );
};

const rowsPerPage = 20;

const SnippetsPage = () => {
  const { collections, loading, error, suggestSync } = useList();
  useEffect(() => {
    suggestSync();
    // Only run the first time we render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const collectionNodes = useMemo(
    () => collections?.edges.map((edge) => edge.node),
    [collections?.edges]
  );
  const tools = useFlatList(collections, (item) => isTool(item));
  const { drafts } = useToolDrafts();
  const filterConfigs = useMemo(
    () => ({
      name: filterConfig({
        name: 'Name',
        component: TextInputFilter,
        extraProps: { placeholder: 'Search' },
        filterFn: textInputFilterByKey('name'),
      }),
      collection: filterConfig({
        name: 'Collection',
        component: MultiSelectFilter,
        extraProps: {
          options: collectionNodes || [],
          ariaLabel: 'Groups',
        },
        filterFn: (item: ListItemType, filterValue?: string[]) =>
          !filterValue ||
          !filterValue.length ||
          filterValue.some(
            (collectionId) => item.collection.id === collectionId
          ),
      }),
    }),
    [collectionNodes]
  );

  const [sort, setSort] = useSort(['name', 'asc']);
  const { page, setPage, PaginationLink } = useRoutePagination();

  const {
    filterStates,
    setFilterStates,
    syncFilterStatesToQueryParams,
    activeFilterCount,
  } = useFilterStates(filterConfigs, {
    shouldSyncWithQueryParams: true,
    setPage,
  });

  const filteredPublishedTools = useMemo(
    () => filterData(tools, filterStates, filterConfigs),
    [filterConfigs, filterStates, tools]
  );

  const filteredSortedPublishedTools = useMemo(() => {
    let sortIteratee: ListIteratee<ListItemType>;
    switch (sort[0]) {
      case 'name':
        sortIteratee = (item) => item.name.toLocaleLowerCase();
        break;
      case 'collection':
        sortIteratee = (item) => [
          item.collection.name.toLocaleLowerCase(),
          item.name.toLocaleLowerCase(),
        ];
        break;
      default:
        throw new Error(`Unknown sort key: ${sort[0]}`);
    }
    return orderBy(filteredPublishedTools, sortIteratee, sort[1]);
  }, [filteredPublishedTools, sort]);

  const filteredDraftTools = useMemo(
    () => filterData(drafts, filterStates, filterConfigs),
    [filterConfigs, filterStates, drafts]
  );

  const filteredSortedDraftTools = useMemo(() => {
    let sortIteratee: ListIteratee<ListItemType>;
    switch (sort[0]) {
      case 'name':
        sortIteratee = 'name';
        break;
      case 'collection':
        sortIteratee = ['collection.name', 'name'];
        break;
      default:
        throw new Error(`Unknown sort key: ${sort[0]}`);
    }
    return orderBy(filteredDraftTools, sortIteratee, sort[1]);
  }, [filteredDraftTools, sort]);

  const tabOptions = [
    {
      label: 'Published',
      value: 'published',
      count: filteredPublishedTools.length,
    },
    {
      label: 'Drafts',
      value: 'drafts',
      count: filteredDraftTools.length,
    },
  ];

  const { tabValue, setTabValue } = useTabValue(tabOptions, { setPage });
  const updateTabValue = (newTabValue: string) => {
    setTabValue(newTabValue);
    trackEvent({
      category: 'snippets_page',
      action: `select_tab_${newTabValue}`,
    });
  };

  const renderCsvRow = (tool: ListItemType) => [
    tool.name,
    tool.collection.name,
    `${process.env.REACT_APP_HOST}/dashboard/snippets/${tool.staticId}`,
    DateTime.fromISO(tool.createdAt).toFormat('yyyy-MM-dd'), // every update creates a new version
  ];
  const date = DateTime.now().toFormat('yyyy-MM-dd');
  const csvFileName = `Kenchi snippets ${date}.csv`;

  if (!collections) {
    if (loading) {
      return <LoadingSpinner name="snippets page" />;
    }
    if (error) {
      return <ErrorAlert title="Error loading content" error={error} />;
    }
    throw new Error('Error loading content');
  }

  const columnHeadings: ColumnHeading[] = [
    { sortKey: 'name', value: 'Name' },
    { sortKey: 'collection', value: 'Collection' },
    { value: 'URL', forCsvOnly: true },
    { value: 'Updated at', forCsvOnly: true },
  ];

  const rowsForTabValue = {
    published: filteredSortedPublishedTools,
    drafts: filteredSortedDraftTools,
  };

  return (
    <PageContainer
      meta={{ title: 'Snippets' }}
      heading="Snippets"
      actions={
        <>
          <TableFilter
            configs={filterConfigs}
            states={filterStates}
            onChange={(states) => {
              trackEvent({
                category: 'snippets_page',
                action: 'set_filter',
                label: 'Set filter',
                filterStates: states,
              });
              setFilterStates(states);
            }}
            onClose={() => {
              syncFilterStatesToQueryParams();
            }}
          />
          <CSVExport
            data={rowsForTabValue[tabValue as keyof typeof rowsForTabValue]}
            renderRow={renderCsvRow}
            columnHeadings={columnHeadings}
            fileName={csvFileName}
            onClickExport={() =>
              trackEvent({
                category: 'snippets_page',
                action: 'download_csv',
                label: 'Download CSV',
              })
            }
          />
          <LinkWithIcon to="snippets/new" icon={faPlusCircle}>
            New snippet
          </LinkWithIcon>
        </>
      }
    >
      <ContentCard fullBleed>
        <ContentCardTabs
          value={tabValue}
          onChange={updateTabValue}
          options={tabOptions}
        />
        <PreloadedTable
          columnHeadings={columnHeadings}
          data={rowsForTabValue[tabValue as keyof typeof rowsForTabValue]}
          page={page}
          PaginationLink={PaginationLink}
          rowsPerPage={rowsPerPage}
          emptyState={
            <EmptyState
              filtersAreActive={activeFilterCount > 0}
              tabValue={tabValue}
            />
          }
          onSortChange={(sort) => {
            setPage(1);
            setSort(sort);
          }}
          rowRender={(tool) => {
            const isDraft = tool.branchType === BranchTypeEnum.draft;
            return (
              <ToolHoverCard toolId={tool.staticId} key={tool.staticId}>
                <TableRowLink
                  to={
                    isDraft
                      ? `snippets/${tool.staticId}/branch/${tool.branchId}`
                      : `snippets/${tool.staticId}`
                  }
                  key={tool.staticId}
                >
                  <td>
                    <NameWithEmoji
                      name={tool.name}
                      emoji={tool.icon}
                      fallbackIcon={faMailBulk}
                    />
                  </td>
                  <td>{tool.collection.name}</td>
                </TableRowLink>
              </ToolHoverCard>
            );
          }}
          sort={sort}
        />
      </ContentCard>
    </PageContainer>
  );
};

export default SnippetsPage;
