import { useMemo } from 'react';

import { gql, useMutation, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faArchive, faPencil } from '@fortawesome/pro-solid-svg-icons';
import { DateTime } from 'luxon';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { ContentColumnHeading } from '@kenchi/ui/lib/Dashboard/ContentColumn';
import {
  LinkButtonWithIcon,
  LinkWithIcon,
} from '@kenchi/ui/lib/Dashboard/LinkWithIcon';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { Tabs } from '@kenchi/ui/lib/Dashboard/Tabs';
import {
  DateRangeGrouping,
  DateRangePicker,
  DateRangePreset,
  dateRangePresets,
} from '@kenchi/ui/lib/DateRangePicker';
import { Dialog } from '@kenchi/ui/lib/Dialog';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  ArchiveCollectionMutation,
  ArchiveCollectionMutationVariables,
  CollectionPageQuery,
  CollectionPageQueryVariables,
  InsightsTypeEnum,
} from '../../graphql/generated';
import { useHasCollectionPermission } from '../../graphql/useSettings';
import { RatingsStatistic } from '../../insights/useRatingsInsights';
import { trackEvent } from '../../utils/analytics';
import useConfirm from '../../utils/useConfirm';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import { sharedWith } from '../sharedWith';
import useTabValue from '../useTabValue';
import { CollectionContentTable } from './CollectionContentTable';
import { CollectionEditDialog } from './CollectionEditDialog';
import CollectionRatingsChart from './CollectionRatingsChart';
import CollectionRatingsTable from './CollectionRatingsTable';
import CollectionUsageChart from './CollectionUsageChart';

const QUERY = gql`
  query CollectionPageQuery($id: ID!) {
    viewer {
      organization {
        id
        hasIntercomAccessToken
        shadowRecord
      }
    }
    node(id: $id) {
      ... on Collection {
        id
        name
        icon
        description
        isArchived
        acl {
          user {
            id
            name
          }
          userGroup {
            id
            name
          }
        }
        workflows(first: 1000, includeArchived: true) {
          edges {
            node {
              id
              branchId
              staticId
              name
              icon
              isArchived
              createdAt
            }
          }
        }
        tools(first: 1000, includeArchived: true) {
          edges {
            node {
              id
              branchId
              staticId
              name
              isArchived
              createdAt
            }
          }
        }
      }
    }
  }
`;

const ARCHIVE_MUTATION = gql`
  mutation ArchiveCollectionMutation($id: ID!) {
    archiveCollection(id: $id) {
      error {
        ...KenchiErrorFragment
      }
      collection {
        id
        isArchived
      }
    }
  }
  ${KenchiErrorFragment}
`;

const layoutStyle = css`
  ${tw`grid grid-cols-2 gap-8 items-start`}
`;

const columnStyle = css`
  ${tw`grid gap-8 items-start`}
`;

export const tabOptions = [
  { label: 'Snippets', queryParamValue: 'snippets', value: 'tools' },
  { label: 'Playbooks', queryParamValue: 'playbooks', value: 'workflows' },
];

const HeadingContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
`;

const SubheadingContainer = styled.div`
  display: grid;
  gap: 0.25rem;
`;

export const CollectionPage = () => {
  const history = useHistory();
  const [
    {
      start: startFromQueryParams,
      end: endFromQueryParams,
      grouping: groupingFromQueryParams,
    },
    setQueryParams,
  ] = useSimpleQueryParams();
  const [confirm, ConfirmDialog] = useConfirm();
  const { id } = useParams<{ id: string }>();
  const { tabValue, setTabValue } = useTabValue(tabOptions);
  const canEdit = useHasCollectionPermission(
    id ?? null,
    'manage_collection_permissions'
  );

  // TODO: find a better approach for this that works well with all routes
  //       defined in App.tsx (rather than nested routes)
  const url = `/dashboard/collections/${id}`;
  const editUrl = `${url}/edit`;
  const isEditing = !!useRouteMatch(editUrl);
  const closeEditDialog = () => history.push(url);

  const defaultChartStart = dateRangePresets.pastThirtyDays.start();
  const defaultChartEnd = dateRangePresets.pastThirtyDays.end();
  const defaultChartGrouping = DateRangeGrouping.week;

  const chartStart = startFromQueryParams
    ? DateTime.fromISO(startFromQueryParams)
    : defaultChartStart;
  const chartEnd = endFromQueryParams
    ? DateTime.fromISO(endFromQueryParams)
    : defaultChartEnd;
  const chartGrouping = (groupingFromQueryParams ||
    defaultChartGrouping) as Exclude<
    DateRangeGrouping,
    DateRangeGrouping.overall
  >;

  const onChangeDates = (
    start: DateTime,
    end: DateTime,
    preset: DateRangePreset | 'custom'
  ) => {
    trackEvent({
      category: 'collection',
      action: 'change_dates',
      label: 'Change dates for collection insights',
      start: start.toISODate(),
      end: end.toISODate(),
      preset,
      grouping: chartGrouping,
    });
    setQueryParams(
      {
        start: start.toISODate(),
        end: end.toISODate(),
      },
      { shouldReplaceState: true }
    );
  };

  const onChangeGrouping = (grouping: DateRangeGrouping) => {
    trackEvent({
      category: 'collection',
      action: 'change_grouping',
      label: 'Change grouping for collection insights',
      start: chartStart.toISODate(),
      end: chartEnd.toISODate(),
      grouping,
    });
    setQueryParams({ grouping }, { shouldReplaceState: true });
  };

  const { data, loading, error } = useQuery<
    CollectionPageQuery,
    CollectionPageQueryVariables
  >(QUERY, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  // TODO: display status
  const [archive, _archiveStatus] = useMutation<
    ArchiveCollectionMutation,
    ArchiveCollectionMutationVariables
  >(ARCHIVE_MUTATION, {
    refetchQueries: [{ query: QUERY }],
    awaitRefetchQueries: true,
  });

  const collection = data?.node?.__typename === 'Collection' ? data.node : null;
  const [workflows, tools] = useMemo(() => {
    if (!collection) {
      return [null, null];
    }
    const workflows = collection.workflows.edges.map((edge) => edge.node);
    const tools = collection.tools.edges.map((edge) => edge.node);
    return [workflows, tools] as const;
  }, [collection]);

  if (!data) {
    if (loading) {
      return <LoadingSpinner name="collection page" />;
    }
    if (error) {
      return <ErrorAlert title="Error loading collection" error={error} />;
    }
    throw new Error('Error loading collection');
  }

  if (!collection || !workflows || !tools) {
    return <NotFoundAlert title="Collection not found" />;
  }

  const isEmpty = [...workflows, ...tools].every((item) => item.isArchived);
  const canArchive = canEdit && isEmpty;

  if (collection.isArchived) {
    return (
      <PageContainer
        meta={{ title: `[Archived] ${collection.name} collection` }}
        icon={collection.icon}
        heading={<>{collection.name || <em>Unnamed</em>}</>}
      >
        <ContentCard fullBleed>
          <div
            css={({ colors }: KenchiTheme) => css`
              color: ${colors.gray[12]};
              ${tw`p-8 text-center`}
            `}
          >
            This collection has been archived.
            {/* TODO: restore button? */}
          </div>
        </ContentCard>
      </PageContainer>
    );
  }

  const maybeButtonsForEditAndArchive = canEdit ? (
    <>
      <div
        css={css`
          display: inline-grid;
          gap: 0.5rem;
          grid-template-columns: auto auto;
          font-size: 1rem;
        `}
      >
        {canArchive && (
          <LinkButtonWithIcon
            icon={faArchive}
            onClick={async () => {
              if (
                await confirm(
                  'Are you sure you want to archive this collection?',
                  { textForConfirmButton: 'Archive' }
                )
              ) {
                await archive({ variables: { id: collection.id } });
                history.push('/dashboard/collections');
              }
            }}
          >
            Archive
          </LinkButtonWithIcon>
        )}
        <LinkWithIcon to={editUrl} icon={faPencil}>
          Edit
        </LinkWithIcon>
      </div>

      {/* Always render Dialog so that the open/close transitions work and use `isOpen` to conditionally render itself and its contents. This is intentionally placed near the thing that toggles so that it renders consistently/statically, otherwise history changes will skip the close transition. */}
      <Dialog width="small" isOpen={isEditing} onClose={closeEditDialog}>
        <CollectionEditDialog
          title={`Edit collection: ${collection.name}`}
          id={collection.id}
          onBack={closeEditDialog}
        />
      </Dialog>
    </>
  ) : null;

  const heading = (
    <HeadingContainer>
      {collection.name || <em>Unnamed</em>}
      {maybeButtonsForEditAndArchive}
    </HeadingContainer>
  );
  // organization can only really be null when not logged in
  const canHaveRatings = data.viewer.organization?.hasIntercomAccessToken;

  const toolCreationUrl = `/dashboard/snippets/new?collectionId=${collection.id}`;
  const workflowCreationUrl = `/dashboard/playbooks/new?collectionId=${collection.id}`;

  return (
    <>
      <ConfirmDialog />
      <PageContainer
        width="xl"
        meta={{ title: `${collection.name} collection` }}
        icon={collection.icon}
        heading={heading}
        subheading={
          <SubheadingContainer>
            {collection.description && <div>{collection.description}</div>}
            <div>Shared with {sharedWith(collection.acl) || 'everyone'}</div>
          </SubheadingContainer>
        }
        actions={
          <DateRangePicker
            onChangeDates={onChangeDates}
            onChangeGrouping={onChangeGrouping}
            selectedEnd={chartEnd}
            selectedGrouping={chartGrouping}
            selectedStart={chartStart}
          />
        }
      >
        <div css={layoutStyle}>
          <div css={columnStyle}>
            <Tabs
              value={tabValue}
              onChange={setTabValue}
              options={tabOptions}
            />
            {tabValue === 'tools' && (
              <div css={columnStyle}>
                <CollectionUsageChart
                  collectionId={collection.id}
                  start={chartStart}
                  end={chartEnd}
                  type={InsightsTypeEnum.toolUsage}
                  dataTitle="Snippets run"
                  dateGrouping={chartGrouping}
                />
                <CollectionContentTable
                  collectionId={collection.id}
                  collectionName={collection.name}
                  type="snippet"
                  items={tools}
                  creationUrl={toolCreationUrl}
                  startDate={chartStart}
                  endDate={chartEnd}
                  canHaveRatings={canHaveRatings}
                  queryParams={{
                    start: startFromQueryParams,
                    end: endFromQueryParams,
                    grouping: groupingFromQueryParams,
                  }}
                />
              </div>
            )}
            {tabValue === 'workflows' && (
              <div css={columnStyle}>
                <CollectionUsageChart
                  collectionId={collection.id}
                  start={chartStart}
                  end={chartEnd}
                  type={InsightsTypeEnum.workflowUsage}
                  dataTitle="Playbooks viewed"
                  dateGrouping={chartGrouping}
                />
                <CollectionContentTable
                  collectionId={collection.id}
                  collectionName={collection.name}
                  type="playbook"
                  items={workflows}
                  creationUrl={workflowCreationUrl}
                  startDate={chartStart}
                  endDate={chartEnd}
                  canHaveRatings={canHaveRatings}
                />
              </div>
            )}
          </div>

          {canHaveRatings && (
            <div css={columnStyle}>
              <ContentColumnHeading>CSAT</ContentColumnHeading>
              <CollectionRatingsChart
                collectionId={collection.id}
                startDate={chartStart}
                endDate={chartEnd}
                statistic={RatingsStatistic.percent4or5}
                dateGrouping={chartGrouping}
              />
              <CollectionRatingsTable
                collectionId={collection.id}
                collectionName={collection.name}
                startDate={chartStart}
                endDate={chartEnd}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
};

export default CollectionPage;
