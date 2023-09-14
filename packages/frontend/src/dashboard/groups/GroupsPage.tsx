import { useCallback } from 'react';

import { css } from '@emotion/react';
import { faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
import sortBy from 'lodash/sortBy';
import { useHistory, useParams } from 'react-router-dom';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LinkWithIcon } from '@kenchi/ui/lib/Dashboard/LinkWithIcon';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable } from '@kenchi/ui/lib/Dashboard/Table';
import { Dialog } from '@kenchi/ui/lib/Dialog';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { linkStyle } from '@kenchi/ui/lib/Text';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';
import { useMeta } from '@kenchi/ui/lib/useMeta';

import ErrorAlert from '../../components/ErrorAlert';
import { GroupsQuery } from '../../graphql/generated';
import useOrgMembers from '../../graphql/useOrgMembers';
import useSettings, { useHasOrgPermission } from '../../graphql/useSettings';
import { pluralize } from '../../utils';
import { EditGroupForm } from './EditGroupForm';
import { NewGroupForm } from './NewGroupForm';
import useGroups from './useGroups';

type GroupRowProps = {
  group: NonNullable<
    GroupsQuery['viewer']['organization']
  >['userGroups']['edges'][number]['node'];
  myId: string | undefined;
  editDialogIsOpen: boolean;
  closeEditDialog: () => void;
};

const GroupRow = ({
  group,
  myId,
  editDialogIsOpen,
  closeEditDialog,
}: GroupRowProps) => {
  const canManageGroup = useHasOrgPermission('manage_users');

  const { data: orgMembers } = useOrgMembers();
  const members = orgMembers?.userGroups.edges.find(
    (edge) => edge.node.id === group.id
  )?.node.members.edges;

  const canManageMembers =
    canManageGroup ||
    (myId && members?.find((edge) => edge.node.id === myId)?.isManager);
  return (
    <tr css={tw`text-sm`}>
      <td>{group.name}</td>
      <td>
        {members ? (
          pluralize(members.length, 'member')
        ) : (
          <LoadingSpinner name="dashboard group members" />
        )}
      </td>
      <td css={tw`text-right`}>
        {canManageMembers ? (
          <>
            <UnstyledLink to={`/dashboard/groups/${group.id}`} css={linkStyle}>
              Edit
            </UnstyledLink>

            {/* Always render Dialog so that the open/close transitions work and use `isOpen` to conditionally render itself and its contents. This is intentionally placed near the thing that toggles so that it renders consistently/statically, otherwise history changes will skip the close transition. */}
            <Dialog isOpen={editDialogIsOpen} onClose={closeEditDialog}>
              <EditGroupForm goBack={closeEditDialog} groupId={group.id} />
            </Dialog>
          </>
        ) : null}
      </td>
    </tr>
  );
};

export default function GroupsPage() {
  useMeta({ title: 'Groups' });
  const { groupId } = useParams<{ groupId?: string }>();
  const history = useHistory();

  const canManageGroup = useHasOrgPermission('manage_users');

  const { groups, loading, error, refetchQueries } = useGroups();
  const settings = useSettings();

  const closeDialog = useCallback(
    () => history.push('/dashboard/groups'),
    [history]
  );

  if (loading && !groups) {
    return <LoadingSpinner name="dashboard groups" />;
  }

  return (
    <PageContainer
      meta={{ title: 'Groups' }}
      heading="Groups"
      subheading="Use groups to manage access to collections for multiple users together"
      width="lg"
      actions={
        canManageGroup ? (
          <LinkWithIcon to="/dashboard/groups/new" icon={faPlusCircle}>
            New group
          </LinkWithIcon>
        ) : null
      }
    >
      <ContentCard fullBleed>
        <ErrorAlert title="Error loading groups" error={error} />
        {groups.length ? (
          <RawTable>
            <thead>
              <tr>
                <th>Name</th>
                <th>Members</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sortBy(groups, ['name']).map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  myId={settings?.viewer.user?.id}
                  editDialogIsOpen={group.id === groupId}
                  closeEditDialog={closeDialog}
                />
              ))}
            </tbody>
          </RawTable>
        ) : (
          <div
            css={({ colors }: KenchiTheme) =>
              css`
                ${tw`p-8 text-center`}
                color: ${colors.gray[12]}
              `
            }
          >
            No groups.{' '}
            {canManageGroup ? (
              <UnstyledLink to="/dashboard/groups/new">
                Create one?
              </UnstyledLink>
            ) : null}
          </div>
        )}
      </ContentCard>

      {/* Always render Dialog so that the open/close transitions work and use `isOpen` to conditionally render itself and its contents */}
      <Dialog isOpen={groupId === 'new'} onClose={closeDialog}>
        <NewGroupForm
          goBack={closeDialog}
          mutationOptions={{
            refetchQueries,
            awaitRefetchQueries: true,
          }}
        />
      </Dialog>
    </PageContainer>
  );
}
