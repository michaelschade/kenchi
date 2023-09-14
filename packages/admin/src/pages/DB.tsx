import { gql, useMutation, useQuery } from '@apollo/client';
import { DateTime } from 'luxon';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable } from '@kenchi/ui/lib/Dashboard/Table';

import { DbQuery, UpgradeMutation } from '../graphql/generated';

const QUERY = gql`
  query DBQuery {
    admin {
      migrations {
        id
        runOn
      }
    }
  }
`;

const UPGRADE_MUTATION = gql`
  mutation UpgradeMutation {
    upgradeDB {
      stdout
      stderr
    }
  }
`;

function MigrationRow({ id, runOn }: { id: string; runOn?: string | null }) {
  return (
    <tr>
      <td>{id}</td>
      <td>{runOn && DateTime.fromISO(runOn).toRelative()}</td>
    </tr>
  );
}

const DBMigrations = () => {
  const { data, loading } = useQuery<DbQuery>(QUERY);
  const [upgrade, { data: upgradeData, loading: upgradeLoading }] =
    useMutation<UpgradeMutation>(UPGRADE_MUTATION, {
      refetchQueries: [{ query: QUERY }],
      awaitRefetchQueries: true,
    });
  if (!data || !data.admin) {
    if (loading) {
      return <>Loading</>;
    } else {
      return <>Error</>;
    }
  }

  return (
    <>
      <div>
        {data.admin.migrations.some((m) => !m.runOn) && (
          <button
            type="button"
            disabled={upgradeLoading}
            onClick={() => upgrade()}
          >
            Upgrade DB
          </button>
        )}
        {upgradeData && (
          <pre>
            stdout:
            {upgradeData.upgradeDB.stdout}
            stderr:
            {upgradeData.upgradeDB.stderr}
          </pre>
        )}
      </div>
      <ContentCard fullBleed>
        <RawTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Run...</th>
            </tr>
          </thead>
          <tbody>
            {data.admin.migrations.map(({ id, runOn }) => (
              <MigrationRow key={id} id={id} runOn={runOn} />
            ))}
          </tbody>
        </RawTable>
      </ContentCard>
    </>
  );
};

export default function DBMigrationsPage() {
  return (
    <PageContainer heading="Database Migrations">
      <DBMigrations />
    </PageContainer>
  );
}
