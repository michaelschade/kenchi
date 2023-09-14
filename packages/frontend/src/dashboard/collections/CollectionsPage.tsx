import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';
import { faFolder, faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
import { ListIteratee } from 'lodash';
import orderBy from 'lodash/orderBy';
import { useHistory, useRouteMatch } from 'react-router-dom';
import tw from 'twin.macro';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LinkWithIcon } from '@kenchi/ui/lib/Dashboard/LinkWithIcon';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import {
  ColumnHeading,
  PreloadedTable,
  TableRowLink,
} from '@kenchi/ui/lib/Dashboard/Table';
import {
  DateRangeGrouping,
  dateRangePresets,
} from '@kenchi/ui/lib/DateRangePicker';
import { Dialog } from '@kenchi/ui/lib/Dialog';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';

import ErrorAlert from '../../components/ErrorAlert';
import { CollectionListItemFragment } from '../../graphql/fragments';
import {
  CollectionsPageQuery,
  InsightsObjectGroupingEnum,
  InsightsTypeEnum,
} from '../../graphql/generated';
import {
  aggregateRatings,
  RatingsStatistic,
  useRatingsInsights,
} from '../../insights/useRatingsInsights';
import { useUsageInsights } from '../../insights/useUsageInsights';
import { pluralize } from '../../utils';
import { trackEvent } from '../../utils/analytics';
import { useCollectionPermission } from '../../utils/useCollectionPermission';
import { useSort } from '../../utils/useSort';
import { CSATChartCell, UsageCell } from './InlineInsights';
import NewCollectionDialog from './NewCollectionDialog';

const QUERY = gql`
  query CollectionsPageQuery {
    viewer {
      organization {
        id
        hasIntercomAccessToken
        shadowRecord
      }
      user {
        id
        collections(first: 1000) {
          edges {
            node {
              ...CollectionListItemFragment
              acl {
                id
                user {
                  id
                  email
                }
                userGroup {
                  id
                  name
                }
                permissions
              }
              organization {
                id
                name
              }
              workflowCount
              toolCount
              defaultPermissions
            }
          }
        }
      }
    }
  }
  ${CollectionListItemFragment}
`;

type CollectionConnection = NonNullable<
  CollectionsPageQuery['viewer']['user']
>['collections'];
type Collection = CollectionConnection['edges'][number]['node'];

type CollectionRowProps = {
  collection: Collection;
  myId: string;
  children?: React.ReactNode | React.ReactNode[];
};

function CollectionRow({ collection, myId, children }: CollectionRowProps) {
  const [, permissionString] = useCollectionPermission(collection, myId);

  const workflowContents =
    collection.workflowCount > 0
      ? pluralize(collection.workflowCount, 'playbook')
      : 'None';
  const toolContents =
    collection.toolCount > 0
      ? pluralize(collection.toolCount, 'snippet')
      : 'None';

  return (
    <TableRowLink to={`/dashboard/collections/${collection.id}`}>
      <td>
        <NameWithEmoji
          name={collection.name || <span css={tw`text-red-400`}>Unnamed</span>}
          emoji={collection.icon}
          fallbackIcon={faFolder}
        />
      </td>
      <td>{workflowContents}</td>
      <td>{toolContents}</td>
      <td>{permissionString}</td>
      {children}
    </TableRowLink>
  );
}

const Collections = ({
  myId,
  collections,
  canHaveRatings,
}: {
  myId: string;
  collections: CollectionConnection;
  canHaveRatings?: boolean;
}) => {
  const collectionIds = useMemo(
    () => collections.edges.map((edge) => edge.node.id),
    [collections]
  );

  const startDate = dateRangePresets.pastNinetyDays.start();
  const endDate = dateRangePresets.pastNinetyDays.end();

  const { usage } = useUsageInsights({
    collectionIds,
    type: InsightsTypeEnum.toolUsage,
    startDate,
    endDate,
    dateGrouping: DateRangeGrouping.overall,
    objectGrouping: InsightsObjectGroupingEnum.collectionId,
  });

  const { ratings, labels: ratingsLabels } = useRatingsInsights({
    collectionIds,
    startDate,
    endDate,
    dateGrouping: DateRangeGrouping.week,
    objectGrouping: InsightsObjectGroupingEnum.collectionId,
    statistic: RatingsStatistic.percent4or5,
  });

  // Not perfectly accourate as it'll double-count tickets where multiple items
  // across multiple collections were used.
  const overallAverage = useMemo(() => {
    if (!ratings) {
      return undefined;
    }
    return aggregateRatings(
      Object.values(ratings).map((row) => aggregateRatings(row))
    ).value;
  }, [ratings]);

  const [sort, setSort] = useSort(['name', 'asc']);

  const collectionNodes = useMemo(
    () => collections.edges.map((e) => e.node),
    [collections.edges]
  );

  const sortedCollections = useMemo(() => {
    let sortIteratee: ListIteratee<Collection>;
    switch (sort[0]) {
      case 'name':
        sortIteratee = (item) => item.name.toLocaleLowerCase();
        break;
      case 'playbooks':
        sortIteratee = (item) => item.workflowCount;
        break;
      case 'snippets':
        sortIteratee = (item) => item.toolCount;
        break;
      case 'usage':
        sortIteratee = ({ id }: Collection) => usage?.[id] || 0;
        break;
      case 'csat':
        sortIteratee = ({ id }: Collection) => {
          if (ratings?.[id]) {
            const { value } = aggregateRatings(ratings?.[id]);
            return value;
          }
          return -1; // Make sure unrated items are at the bottom
        };
        break;
      default:
        throw new Error(`Unknown sort key: ${sort[0]}`);
    }
    return orderBy(collectionNodes, sortIteratee, sort[1]);
  }, [collectionNodes, sort, usage, ratings]);

  const columnHeadings: ColumnHeading[] = [
    { sortKey: 'name', value: <NameWithEmoji name="Collection" /> },
    { sortKey: 'playbooks', value: 'Playbooks' },
    { sortKey: 'snippets', value: 'Snippets' },
    'Visible to',
    {
      sortKey: 'usage',
      value: 'Usage',
      align: 'right',
      helpText: 'Number of snippets run in the last 90 days', // TODO: hacky as all hell (SEO: dateRangePresets.pastNinetyDays)
    },
  ];
  if (canHaveRatings) {
    let ratingsHelpText =
      'Percent of 4 or 5 CSAT ratings, compared to overall average';
    if (overallAverage !== undefined && !isNaN(overallAverage)) {
      ratingsHelpText += ` (${Math.round(overallAverage)}%)`;
    }
    columnHeadings.push({
      sortKey: 'csat',
      value: 'CSAT',
      helpText: ratingsHelpText,
      align: 'center',
      colSpan: 2,
    });
  }

  return (
    <ContentCard fullBleed>
      <PreloadedTable
        size="sm"
        columnHeadings={columnHeadings}
        sort={sort}
        onSortChange={setSort}
        data={sortedCollections}
        rowsPerPage={100}
        rowRender={(collection) => (
          <CollectionRow
            key={collection.id}
            collection={collection}
            myId={myId}
          >
            <UsageCell
              usage={usage ? usage[collection.id] || null : undefined}
            />
            {canHaveRatings && (
              <CSATChartCell
                overallAverage={overallAverage}
                hasUsage={!!usage}
                ratings={ratings ? ratings[collection.id] || [] : undefined}
                ratingsLabels={ratingsLabels}
              />
            )}
          </CollectionRow>
        )}
      />
    </ContentCard>
  );
};

export default function CollectionsPage() {
  const history = useHistory();
  const createCollection = !!useRouteMatch('/dashboard/collections/new');
  const { data, loading, error } = useQuery<CollectionsPageQuery>(QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const onCreate = (id: string) => {
    trackEvent({
      category: 'collections',
      action: 'create',
      label: 'Created new collection',
      object: id,
    });
    history.push(`/dashboard/collections`);
  };

  const onBack = () => {
    trackEvent({
      category: 'collections',
      action: 'cancel_create',
      label: 'Canceled creating collection',
    });
    history.push('/dashboard/collections');
  };

  let content;
  if (data?.viewer.user && data.viewer.organization) {
    const canHaveRatings = data.viewer.organization.hasIntercomAccessToken;
    content = (
      <Collections
        myId={data.viewer.user.id}
        canHaveRatings={canHaveRatings}
        collections={data.viewer.user.collections}
      />
    );
  } else {
    if (loading) {
      content = <LoadingSpinner />;
    } else if (error) {
      content = <ErrorAlert title="Error loading collections" error={error} />;
    } else if (data) {
      // Logged out
      history.push('/login');
    } else {
      throw new Error('Unexpected missing collections');
    }
  }

  return (
    <PageContainer
      meta={{ title: 'Collections' }}
      heading="Collections"
      subheading="Permission-based folders for your playbooks and snippets"
      actions={
        <>
          <LinkWithIcon to="collections/new" icon={faPlusCircle}>
            New collection
          </LinkWithIcon>

          {/* Always render Dialog so that the open/close transitions work and use `isOpen` to conditionally render itself and its contents. This is intentionally placed near the thing that toggles so that it renders consistently/statically, otherwise history changes will skip the close transition. */}
          <Dialog width="medium" isOpen={createCollection} onClose={onBack}>
            <NewCollectionDialog
              title="Create a collection"
              onBack={onBack}
              onCreate={onCreate}
            />
          </Dialog>
        </>
      }
      width="xl"
    >
      {content}
    </PageContainer>
  );
}
