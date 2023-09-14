import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { DateTime } from 'luxon';

import { DangerButton, PrimaryButton } from '@kenchi/ui/lib/Button';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable } from '@kenchi/ui/lib/Dashboard/Table';

import {
  NotifyProductChangeMutation,
  NotifyProductChangeMutationVariables,
  ProductChangesQuery,
  ProductChangeStatsQuery,
  ProductChangeStatsQueryVariables,
} from '../graphql/generated';

const QUERY = gql`
  query ProductChangesQuery {
    viewer {
      productChanges(first: 100) {
        edges {
          cursor
          node {
            id
            title
            description
            createdAt
            notification {
              id
              createdAt
            }
          }
        }
      }
    }
  }
`;

const QUERY_STATS = gql`
  query ProductChangeStatsQuery($id: ID!) {
    admin {
      notificationStats(id: $id) {
        created
        viewed
        dismissed
      }
    }
  }
`;

const NOTIFY_MUTATION = gql`
  mutation NotifyProductChangeMutation($id: ID!) {
    notifyProductChange(id: $id) {
      id
      createdAt
    }
  }
`;

function NotificationStats({
  stats,
}: {
  stats?:
    | NonNullable<ProductChangeStatsQuery['admin']>['notificationStats']
    | null;
}) {
  if (!stats) {
    return <>Error loading stats</>;
  }
  return (
    <div>
      Created: {stats.created} &bull; Dismissed: {stats.dismissed} &bull;
      Viewed: {stats.viewed}
    </div>
  );
}

function ChangeRow({
  change,
}: {
  change: ProductChangesQuery['viewer']['productChanges']['edges'][number]['node'];
}) {
  const [queryStats, { data: queryData, loading: queryLoading }] = useLazyQuery<
    ProductChangeStatsQuery,
    ProductChangeStatsQueryVariables
  >(QUERY_STATS);

  const [notify, { data: notifyData, loading: notifyLoading }] = useMutation<
    NotifyProductChangeMutation,
    NotifyProductChangeMutationVariables
  >(NOTIFY_MUTATION);

  return (
    <tr>
      <td>{change.title}</td>
      {/*<td><code>{JSON.stringify(change.description, undefined, 2)}</code></td>*/}
      <td style={{ fontSize: '0.875rem' }}>
        {DateTime.fromISO(change.createdAt).toFormat('ff')}
      </td>
      <td style={{ fontSize: '0.875rem' }}>
        {change.notification
          ? DateTime.fromISO(change.notification.createdAt).toFormat('ff')
          : null}
      </td>
      <td style={{ fontSize: '0.875rem' }}>
        {queryData && (
          <NotificationStats stats={queryData.admin?.notificationStats} />
        )}
      </td>
      <td style={{ fontSize: '0.875rem' }}>
        {change.notification ? (
          <PrimaryButton
            size="tiny"
            disabled={!!(queryLoading || queryData)}
            onClick={() =>
              queryStats({ variables: { id: change.notification!.id } })
            }
          >
            View Stats
          </PrimaryButton>
        ) : notifyData ? (
          <>Notified everyone</>
        ) : (
          <DangerButton
            size="tiny"
            disabled={notifyLoading}
            onClick={() => notify({ variables: { id: change.id } })}
          >
            Notify Everyone
          </DangerButton>
        )}
      </td>
    </tr>
  );
}

export default function ProductChanges() {
  const { data, loading } = useQuery<ProductChangesQuery>(QUERY);
  if (!data || !data.viewer) {
    if (loading) {
      return <>Loading</>;
    } else {
      return <>Error</>;
    }
  }

  return (
    <PageContainer heading="Product changes" width="xl">
      <ContentCard fullBleed>
        <RawTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Created At</th>
              <th>Notification Sent At</th>
              <th>Stats</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.viewer.productChanges.edges.map(({ node }) => (
              <ChangeRow key={node.id} change={node} />
            ))}
          </tbody>
        </RawTable>
      </ContentCard>
    </PageContainer>
  );
}
