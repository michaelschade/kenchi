import { gql, useQuery } from '@apollo/client';
import { Link, useHistory, useParams } from 'react-router-dom';

import { PrimaryButton } from '@kenchi/ui/lib/Button';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable, TableRowLink } from '@kenchi/ui/lib/Dashboard/Table';

import {
  NonOrgUsersQuery,
  OrgQuery,
  OrgQueryVariables,
  OrgsQuery,
} from '../graphql/generated';
import useLoginAs from '../utils/useLoginAs';

const ORGS_QUERY = gql`
  query OrgsQuery {
    admin {
      organizations(first: 1000) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`;

const ORG_QUERY = gql`
  query OrgQuery($id: ID!) {
    admin {
      organization(id: $id) {
        id
        name
        googleDomain
        users(first: 1000) {
          edges {
            node {
              id
              name
              email
            }
          }
        }
      }
    }
  }
`;

const NON_ORG_USERS_QUERY = gql`
  query NonOrgUsersQuery {
    admin {
      nonOrgUsers(first: 1000) {
        edges {
          node {
            id
            name
            email
          }
        }
      }
    }
  }
`;

function ListOrganizations() {
  const { data, loading } = useQuery<OrgsQuery>(ORGS_QUERY);

  if (!data || !data.admin) {
    if (loading) {
      return <>Loading</>;
    } else {
      return <>Error</>;
    }
  }

  return (
    <PageContainer
      heading="Organizations"
      subheading="One does not simply list all users in the Kenchi universe"
    >
      <ContentCard fullBleed>
        <RawTable>
          <thead>
            <tr>
              <th>Name</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <TableRowLink to="/organizations/null">
              <td>
                <em>Non-org users</em>
              </td>
            </TableRowLink>
            {data.admin.organizations.edges.map(
              ({ node }) =>
                node.name && (
                  <TableRowLink to={`/organizations/${node.id}`}>
                    <td>{node.name}</td>
                  </TableRowLink>
                )
            )}
          </tbody>
        </RawTable>
      </ContentCard>
    </PageContainer>
  );
}

type Org = NonNullable<NonNullable<OrgQuery['admin']>['organization']>;

function UsersTable({
  users,
}: {
  users: Org['users']['edges'][number]['node'][];
}) {
  const history = useHistory();
  const [loginAs] = useLoginAs();
  return (
    <ContentCard fullBleed title="Users">
      <RawTable>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((node) => (
            <tr key={node.id}>
              <td>{node.email}</td>
              <td>{node.name}</td>
              <td>
                <PrimaryButton
                  size="tiny"
                  onClick={(e) => {
                    e.stopPropagation();
                    history.push(`/users/${node.id}/domains`);
                  }}
                >
                  Settings
                </PrimaryButton>{' '}
                <PrimaryButton
                  size="tiny"
                  onClick={(e) => {
                    e.stopPropagation();
                    loginAs({ userId: node.id });
                  }}
                >
                  Login As
                </PrimaryButton>
              </td>
            </tr>
          ))}
        </tbody>
      </RawTable>
    </ContentCard>
  );
}

function ViewOrganization({ id }: { id: string }) {
  const { data, loading } = useQuery<OrgQuery, OrgQueryVariables>(ORG_QUERY, {
    variables: { id },
  });

  const org = data?.admin?.organization;
  if (!org) {
    if (loading) {
      return <>Loading</>;
    } else {
      return <>Error</>;
    }
  }

  const orgName = org.name || org.googleDomain || 'Org';

  return (
    <PageContainer heading={orgName}>
      <div>
        <Link to="/organizations">« Back to Organizations</Link>
      </div>
      <div>
        <Link to={`/organizations/${id}/domains`}>Domain Flags</Link>
      </div>
      <UsersTable users={org.users.edges.map((e) => e.node)} />
    </PageContainer>
  );
}

function ViewNonOrgUsers() {
  const { data, loading } = useQuery<NonOrgUsersQuery>(NON_ORG_USERS_QUERY);

  if (!data?.admin?.nonOrgUsers) {
    if (loading) {
      return <>Loading</>;
    } else {
      return <>Error</>;
    }
  }

  return (
    <PageContainer heading="Non-org users">
      <div>
        <Link to="/organizations">« Back to Organizations</Link>
      </div>
      <UsersTable users={data.admin.nonOrgUsers.edges.map((e) => e.node)} />
    </PageContainer>
  );
}

export default function ViewOrganizations() {
  const { orgId } = useParams<{ orgId?: string }>();
  if (orgId) {
    if (orgId === 'null') {
      return <ViewNonOrgUsers />;
    } else {
      return <ViewOrganization id={orgId} />;
    }
  } else {
    return <ListOrganizations />;
  }
}
