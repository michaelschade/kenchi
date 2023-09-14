import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faCheckCircle, faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import { orderBy } from 'lodash';
import sortBy from 'lodash/sortBy';
import { DateTime } from 'luxon';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LinkWithIcon } from '@kenchi/ui/lib/Dashboard/LinkWithIcon';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import {
  ColumnHeading,
  EmptyStateContainer,
  PreloadedTable,
} from '@kenchi/ui/lib/Dashboard/Table';
import {
  filterConfig,
  filterData,
  FilterStates,
  GenericFilterConfigs,
  MultiSelectFilter,
  RadioInputFilter,
  SwitchInputFilter,
  TableFilter,
  TextInputFilter,
  textInputFilterByKey,
} from '@kenchi/ui/lib/Dashboard/TableFilter';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import ErrorAlert from '../../components/ErrorAlert';
import { AllUsersQuery } from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';
import { useFilterStates } from '../../utils/useFilterStates';
import { useSort } from '../../utils/useSort';
import { useStatePagination } from '../../utils/useStatePagination';
import { UserDialog } from './UserDialog';

const UsersUserGroupFragment = gql`
  fragment UsersUserGroupFragment on UserGroup {
    id
    name
  }
`;

const QUERY = gql`
  query AllUsersQuery {
    viewer {
      organization {
        id
        googleDomain
        additionalGoogleDomains
        defaultUserGroup {
          ...UsersUserGroupFragment
        }
        userGroups(first: 1000) {
          edges {
            node {
              ...UsersUserGroupFragment
            }
          }
        }
        users(includeDisabled: true, first: 1000) {
          edges {
            node {
              id
              name
              email
              disabledAt
              ... on User {
                organizationPermissions
                groups {
                  ...UsersUserGroupFragment
                }
              }
            }
          }
        }
      }
    }
  }
  ${UsersUserGroupFragment}
`;

const TableActionsContainer = styled.div`
  align-items: center;
  display: grid;
  gap: 0.5rem;
  grid-auto-flow: column;
  justify-content: end;
`;

type OrgUser = NonNullable<
  AllUsersQuery['viewer']['organization']
>['users']['edges'][number]['node'];

function isAdmin(user: OrgUser) {
  if (user.__typename !== 'User') {
    return false;
  }
  return user.organizationPermissions.some((p) => p.startsWith('manage_'));
}

function UserRow({ user }: { user: OrgUser }) {
  const location = useLocation();
  const userGroups = user.__typename === 'User' ? user.groups : null;
  return (
    <tr css={tw`text-sm`}>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td css={tw`text-center`}>
        {isAdmin(user) && (
          <FontAwesomeIcon
            css={({ colors }: KenchiTheme) => css`
              color: ${colors.gray[11]};
            `}
            icon={faCheckCircle}
          />
        )}
      </td>
      <td>
        {userGroups &&
          (userGroups.length > 0 ? (
            userGroups.map((group) => group.name).join(', ')
          ) : (
            <em>No groups</em>
          ))}
      </td>
      <td css={tw`text-right`}>
        {user.disabledAt ? (
          <>
            Disabled {DateTime.fromISO(user.disabledAt).toRelative()}
            <HelpIcon content="Contact Kenchi support if you'd like to reactivate a disabled user" />
          </>
        ) : (
          <UnstyledLink to={`/dashboard/users/${user.id}${location.search}`}>
            Edit
          </UnstyledLink>
        )}
      </td>
    </tr>
  );
}

const TableEmptyState = ({
  filtersAreActive,
}: {
  filtersAreActive: boolean;
}) => {
  if (filtersAreActive) {
    return (
      <EmptyStateContainer>
        No users match your filters.{' '}
        <UnstyledLink to="users">Clear filters</UnstyledLink> or{' '}
        <UnstyledLink to="users/new">add a user</UnstyledLink>?
      </EmptyStateContainer>
    );
  }
  captureMessage('No users.');
  return (
    <EmptyStateContainer>
      No users. <UnstyledLink to="users/new">Add a user</UnstyledLink>?
    </EmptyStateContainer>
  );
};

type UsersTableProps<TConfigs extends GenericFilterConfigs<OrgUser>> = {
  activeFilterCount: number;
  filterConfigs: TConfigs;
  filterStates: FilterStates<OrgUser, TConfigs>;
  users: OrgUser[];
};

const COLUMN_HEADINGS: ColumnHeading[] = [
  { sortKey: 'name', value: 'Name' },
  'Email',
  { sortKey: 'admin', value: 'Admin?', align: 'center' },
  'Groups',
  '',
];

const UsersTable = <TConfigs extends GenericFilterConfigs<OrgUser>>({
  activeFilterCount,
  filterStates,
  filterConfigs,
  users,
}: UsersTableProps<TConfigs>) => {
  const [sort, setSort] = useSort(['admin', 'desc']);
  const [page, setPage, PaginationLink] = useStatePagination();

  const sortedUsers = orderBy(
    users,
    sort[0] === 'admin' ? (user) => isAdmin(user) : [sort[0]],
    [sort[1]]
  );

  const sortedFilteredUsers = filterData(
    sortedUsers,
    filterStates,
    filterConfigs
  );

  return (
    <ContentCard fullBleed>
      <PreloadedTable
        data={sortedFilteredUsers}
        page={page}
        PaginationLink={PaginationLink}
        rowRender={(user) => <UserRow user={user} key={user.id} />}
        columnHeadings={COLUMN_HEADINGS}
        sort={sort}
        onSortChange={(sort) => {
          setPage(1);
          setSort(sort);
        }}
        emptyState={
          <TableEmptyState filtersAreActive={activeFilterCount > 0} />
        }
      />
    </ContentCard>
  );
};

export default function UsersPage() {
  const { id: editingUserId } = useParams<{ id?: string }>();
  const history = useHistory();
  const location = useLocation();
  const onCloseDialog = () =>
    history.push(`/dashboard/users${location.search}`);

  const { data, loading, error } = useQuery<AllUsersQuery>(QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const organization = data?.viewer?.organization;
  const allGroups = useMemo(
    () => organization?.userGroups?.edges?.map((e) => e.node),
    [organization?.userGroups?.edges]
  );

  const filterConfigs = useMemo(
    () => ({
      name: filterConfig({
        name: 'Name',
        component: TextInputFilter,
        extraProps: { placeholder: 'Name', ariaLabel: 'Search by name' },
        filterFn: textInputFilterByKey('name'),
      }),
      email: filterConfig({
        name: 'Email',
        component: TextInputFilter,
        extraProps: { placeholder: 'Email', ariaLabel: 'Search by email' },
        filterFn: textInputFilterByKey('email'),
      }),
      role: filterConfig({
        name: 'Role',
        component: RadioInputFilter,
        extraProps: {
          options: [
            { label: 'Admins', value: 'admin' },
            { label: 'Non-admins', value: 'nonAdmin' },
          ],
          ariaLabel: 'User role',
        },
        filterFn: (user: OrgUser, filterValue?: string) => {
          if (!filterValue) {
            return true;
          }
          if (filterValue === 'admin') {
            return isAdmin(user);
          }
          return !isAdmin(user);
        },
      }),
      groups: filterConfig({
        name: 'Groups',
        component: MultiSelectFilter,
        extraProps: {
          options: allGroups || [],
          ariaLabel: 'Groups',
        },
        filterFn: (user: OrgUser, filterValue?: string[]) =>
          !filterValue ||
          !filterValue.length ||
          filterValue.some(
            (groupId) =>
              user.__typename === 'User' &&
              user.groups.some((group) => group.id === groupId)
          ),
      }),
      disabled: filterConfig({
        name: 'Show disabled users',
        component: SwitchInputFilter,
        extraProps: {
          label: 'Show disabled users',
        },
        filterFn: (user: OrgUser, filterValue?: boolean) => {
          return !!user.disabledAt === !!filterValue;
        },
      }),
    }),
    [allGroups]
  );

  const {
    filterStates,
    setFilterStates,
    syncFilterStatesToQueryParams,
    activeFilterCount,
  } = useFilterStates(filterConfigs, {
    shouldSyncWithQueryParams: true,
  });

  if (loading && !data) {
    return <LoadingSpinner name="dashboard users" />;
  }

  if (error || !organization || !allGroups) {
    return <ErrorAlert title="Error loading users" error={error} />;
  }

  const users = sortBy(
    organization.users.edges.map((e) => e.node),
    (u) => [isAdmin(u) ? 1 : 2, u.name ? u.name.toLowerCase() : '___', u.email]
  );

  const usersTableActions = (
    <TableActionsContainer>
      <TableFilter
        configs={filterConfigs}
        states={filterStates}
        onChange={(states) => {
          trackEvent({
            category: 'users_table',
            action: 'set_filter',
            label: 'Set filter',
            filterStates: states,
          });
          setFilterStates(states);
        }}
        onClose={syncFilterStatesToQueryParams}
      />
      <LinkWithIcon to="/dashboard/users/new" icon={faPlusCircle}>
        New user
      </LinkWithIcon>
      {/* Always render the dialog so that the open/close transitions work and use `isOpen` to conditionally render itself and its contents. This is intentionally placed near the thing that toggles so that it renders consistently/statically, otherwise history changes will skip the close transition. */}
      <UserDialog
        onClose={onCloseDialog}
        isOpen={editingUserId === 'new'}
        organization={organization}
        allGroups={allGroups}
        mutationOptions={{
          refetchQueries: [{ query: QUERY }],
          awaitRefetchQueries: true,
        }}
      />
    </TableActionsContainer>
  );

  return (
    <PageContainer
      meta={{ title: 'Users' }}
      heading="Users"
      subheading="Add people to your organization, and manage each person's group membership"
      width="xl"
      actions={usersTableActions}
    >
      <UsersTable
        activeFilterCount={activeFilterCount}
        filterConfigs={filterConfigs}
        filterStates={filterStates}
        users={users}
      />
      {users.map((user) => (
        /* Always render the dialog so that the open/close transitions work and use `isOpen` to conditionally render itself and its contents. This is intentionally placed near the thing that toggles so that it renders consistently/statically, otherwise history changes will skip the close transition. */
        <UserDialog
          isOpen={user.id === editingUserId}
          user={user}
          onClose={onCloseDialog}
          allGroups={allGroups}
          organization={organization}
          key={user.id}
        />
      ))}
    </PageContainer>
  );
}
