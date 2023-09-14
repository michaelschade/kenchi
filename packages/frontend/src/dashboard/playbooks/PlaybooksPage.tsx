import { useEffect, useMemo } from 'react';

import { faFileInvoice, faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
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
import { trackEvent } from '../../utils/analytics';
import { useFilterStates } from '../../utils/useFilterStates';
import { useRoutePagination } from '../../utils/useRoutePagination';
import { useSort } from '../../utils/useSort';
import { isWorkflow } from '../../utils/versionedNode';
import { WorkflowHoverCard } from '../../workflow/WorkflowHoverCard';
import useTabValue from '../useTabValue';
import useWorkflowDrafts from './useWorkflowDrafts';

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
        No playbooks match your filters.{' '}
        <UnstyledLink to="playbooks">Clear filters</UnstyledLink> or{' '}
        <UnstyledLink to="playbooks/new">create a new playbook</UnstyledLink>?
      </EmptyStateContainer>
    );
  }
  const items = tabValue === 'drafts' ? 'draft playbooks' : 'playbooks';
  return (
    <EmptyStateContainer>
      No {items}.{' '}
      <UnstyledLink to="playbooks/new">Create a new playbook?</UnstyledLink>
    </EmptyStateContainer>
  );
};

const PlaybooksPage = () => {
  const { collections, loading, error, suggestSync } = useList();
  // Only run the first time we render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => suggestSync(), []);
  const collectionNodes = useMemo(
    () => collections?.edges.map((edge) => edge.node),
    [collections?.edges]
  );
  const workflows = useFlatList(collections, (item) => isWorkflow(item));
  const { drafts } = useWorkflowDrafts();
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

  const filteredPublishedWorkflows = useMemo(
    () => filterData(workflows, filterStates, filterConfigs),
    [filterConfigs, filterStates, workflows]
  );

  const filteredSortedPublishedWorkflows = useMemo(() => {
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
    return orderBy(filteredPublishedWorkflows, sortIteratee, sort[1]);
  }, [filteredPublishedWorkflows, sort]);

  const filteredDraftWorkflows = useMemo(
    () => filterData(drafts, filterStates, filterConfigs),
    [filterConfigs, filterStates, drafts]
  );

  const filteredSortedDraftWorkflows = useMemo(() => {
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
    return orderBy(filteredDraftWorkflows, sortIteratee, sort[1]);
  }, [filteredDraftWorkflows, sort]);

  const tabOptions = [
    {
      label: 'Published',
      value: 'published',
      count: filteredPublishedWorkflows.length,
    },
    {
      label: 'Drafts',
      value: 'drafts',
      count: filteredDraftWorkflows.length,
    },
  ];
  const { tabValue, setTabValue } = useTabValue(tabOptions, { setPage });
  const updateTabValue = (newTabValue: string) => {
    setTabValue(newTabValue);
    trackEvent({
      category: 'playbooks_page',
      action: `select_tab_${newTabValue}`,
    });
  };

  const renderCsvRow = (workflow: ListItemType) => [
    workflow.name,
    workflow.collection.name,
    `${process.env.REACT_APP_HOST}/dashboard/playbooks/${workflow.staticId}`,
    DateTime.fromISO(workflow.createdAt).toFormat('yyyy-MM-dd'), // every update creates a new version
  ];

  const date = DateTime.now().toFormat('yyyy-MM-dd');
  const csvFileName = `Kenchi playbooks ${date}.csv`;

  if (!collections) {
    if (loading) {
      return <LoadingSpinner name="playbooks page" />;
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
    '',
  ];

  const rowsForTabValue = {
    published: filteredSortedPublishedWorkflows,
    drafts: filteredSortedDraftWorkflows,
  };

  return (
    <PageContainer
      meta={{ title: 'Playbooks' }}
      heading="Playbooks"
      actions={
        <>
          <TableFilter
            configs={filterConfigs}
            states={filterStates}
            onChange={(states) => {
              trackEvent({
                category: 'playbooks_page',
                action: 'set_filter',
                label: 'Set filter',
                filterStates: states,
              });
              setFilterStates(states);
            }}
            onClose={syncFilterStatesToQueryParams}
          />
          <CSVExport
            data={rowsForTabValue[tabValue as keyof typeof rowsForTabValue]}
            renderRow={renderCsvRow}
            columnHeadings={columnHeadings}
            fileName={csvFileName}
            onClickExport={() =>
              trackEvent({
                category: 'playbooks_page',
                action: 'download_csv',
                label: 'Download CSV',
              })
            }
          />
          <LinkWithIcon to="playbooks/new" icon={faPlusCircle}>
            New playbook
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
          rowRender={(workflow) => {
            const isDraft = workflow.branchType === BranchTypeEnum.draft;
            return (
              <WorkflowHoverCard
                key={workflow.staticId}
                workflowId={workflow.staticId}
              >
                <TableRowLink
                  to={
                    isDraft
                      ? `playbooks/${workflow.staticId}/branch/${workflow.branchId}`
                      : `playbooks/${workflow.staticId}`
                  }
                  key={workflow.staticId}
                >
                  <td>
                    <NameWithEmoji
                      name={workflow.name}
                      emoji={workflow.icon}
                      fallbackIcon={faFileInvoice}
                    />
                  </td>
                  <td>{workflow.collection.name}</td>
                </TableRowLink>
              </WorkflowHoverCard>
            );
          }}
          sort={sort}
        />
      </ContentCard>
    </PageContainer>
  );
};

export default PlaybooksPage;
