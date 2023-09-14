import { useState } from 'react';

import { gql, MutationHookOptions, useMutation } from '@apollo/client';
import { css } from '@emotion/react';
import tw from 'twin.macro';

import { DangerButton, LinkButton } from '@kenchi/ui/lib/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@kenchi/ui/lib/Dialog';
import {
  FormControlsContainer,
  FormGroup,
  InputGroup,
  Switch,
} from '@kenchi/ui/lib/Form';
import MultiSelect from '@kenchi/ui/lib/MultiSelect';

import ErrorAlert from '../../components/ErrorAlert';
import { MutateButton } from '../../components/MutateButton';
import { errorFromMutation } from '../../graphql/errorFromMutation';
import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  AllUsersQuery,
  CreateUserMutation,
  CreateUserMutationVariables,
  DisableUserMutation,
  DisableUserMutationVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
  UserDialogOutputFragment as UserDialogOutputFragmentType,
} from '../../graphql/generated';
import useConfirm from '../../utils/useConfirm';

const UserDialogOutputFragment = gql`
  fragment UserDialogOutputFragment on UserOutput {
    error {
      ...KenchiErrorFragment
    }
    user {
      id
      organizationPermissions
      disabledAt
      groups {
        id
        name
      }
    }
  }
  ${KenchiErrorFragment}
`;

const CREATE_USER_MUTATION = gql`
  mutation CreateUserMutation(
    $email: String!
    $groupIds: [ID!]!
    $isOrgAdmin: Boolean!
  ) {
    modify: createUser(
      email: $email
      groupIds: $groupIds
      isOrganizationAdmin: $isOrgAdmin
    ) {
      ...UserDialogOutputFragment
    }
  }
  ${UserDialogOutputFragment}
`;

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUserMutation(
    $id: ID!
    $groupIds: [ID!]!
    $isOrgAdmin: Boolean!
  ) {
    modify: updateUser(
      id: $id
      groupIds: $groupIds
      isOrganizationAdmin: $isOrgAdmin
    ) {
      ...UserDialogOutputFragment
    }
  }
  ${UserDialogOutputFragment}
`;

const DISABLE_USER_MUTATION = gql`
  mutation DisableUserMutation($id: ID!) {
    modify: disableUser(id: $id) {
      ...UserDialogOutputFragment
    }
  }
  ${UserDialogOutputFragment}
`;

type Org = NonNullable<AllUsersQuery['viewer']['organization']>;
type OrgUser = Org['users']['edges'][number]['node'];
type UserGroups = NonNullable<UserDialogOutputFragmentType['user']>['groups'];

function isAdmin(user: OrgUser) {
  if (user.__typename !== 'User') {
    return false;
  }
  return user.organizationPermissions.some((p) => p.startsWith('manage_'));
}

function AddUser({
  organization,
  allGroups,
  onSuccessOrCancel,
  mutationOptions,
}: {
  organization: Org;
  allGroups: UserGroups;
  onSuccessOrCancel: () => void;
  mutationOptions?: Pick<
    MutationHookOptions,
    'refetchQueries' | 'awaitRefetchQueries'
  >;
}) {
  const [email, setEmail] = useState('');
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [groupIds, setGroupIds] = useState<string[]>([]);

  const [createUser, createUserResult] = useMutation<
    CreateUserMutation,
    CreateUserMutationVariables
  >(CREATE_USER_MUTATION, {
    ...mutationOptions,
    onCompleted: (data) => {
      if (data.modify.user) {
        setEmail('');
        setGroupIds([]);
        onSuccessOrCancel();
      }
    },
  });
  const save = () => {
    createUser({
      variables: { email, isOrgAdmin, groupIds },
    });
  };

  const domains = [
    organization.googleDomain,
    ...(organization.additionalGoogleDomains || []),
  ].filter((d): d is string => !!d);

  const orgHasDomains = domains?.length >= 1;

  return (
    <>
      <DialogHeader>
        <h2>Add user</h2>
      </DialogHeader>
      <DialogContent>
        <FormControlsContainer>
          <div>
            {orgHasDomains ? (
              <>
                <p>
                  Users from {domains.join(', ')} will automatically be given
                  accounts
                  {organization.defaultUserGroup && (
                    <>
                      {' '}
                      with the{' '}
                      <strong>{organization.defaultUserGroup.name}</strong> role
                    </>
                  )}
                  .
                </p>
                <p>
                  You can add users outside of these domains, or pre-assign
                  users different roles.
                </p>
              </>
            ) : (
              <p>Add a user to your organization.</p>
            )}
            <p>We will send them an email with a link to install Kenchi.</p>
          </div>
          <InputGroup
            type="email"
            label="Email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
          <FormGroup label="Groups">
            {(id) => (
              <MultiSelect
                options={allGroups}
                selectedOptionIds={groupIds}
                onChange={setGroupIds}
                showTokens
              />
            )}
          </FormGroup>
          <div css={tw`grid justify-items-end`}>
            <Switch
              label="Admin?"
              description="Admins can manage all users, groups, and collections"
              onCheckedChange={setIsOrgAdmin}
              checked={isOrgAdmin}
            />
          </div>
        </FormControlsContainer>
      </DialogContent>
      <DialogFooter>
        <div css={tw`grid gap-4`}>
          <div className="text-right">
            <MutateButton onClick={save} result={createUserResult}>
              Save
            </MutateButton>
          </div>
          <ErrorAlert
            title="Error adding user"
            error={errorFromMutation(createUserResult)}
          />
        </div>
      </DialogFooter>
    </>
  );
}

function UpdateUser({
  user,
  allGroups,
  onSuccessOrCancel,
}: {
  user: OrgUser;
  allGroups: UserGroups;
  onSuccessOrCancel: () => void;
}) {
  const [isOrgAdmin, setIsOrgAdmin] = useState(isAdmin(user));
  const [confirm, ConfirmDialog] = useConfirm();
  const initialGroupIds =
    user.__typename === 'User' ? user.groups.map((g) => g.id) : [];
  const [groupIds, setGroupIds] = useState<string[]>(initialGroupIds);

  const [updateUser, updateUserResult] = useMutation<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >(UPDATE_USER_MUTATION, {
    onCompleted: (data) => {
      if (data.modify.user) {
        onSuccessOrCancel();
      }
    },
  });

  const [disableUser, disableUserResult] = useMutation<
    DisableUserMutation,
    DisableUserMutationVariables
  >(DISABLE_USER_MUTATION, {
    onCompleted: (data) => {
      if (data.modify.user) {
        onSuccessOrCancel();
      }
    },
  });

  const save = () => {
    updateUser({ variables: { id: user.id, isOrgAdmin, groupIds } });
  };

  const maybeDeleteUser = async () => {
    if (
      await confirm(
        `Are you sure you want to disable ${user.email}? They will be immediately logged out and unable to log back in.`,
        { textForConfirmButton: `Disable` }
      )
    ) {
      disableUser({ variables: { id: user.id } });
    }
  };

  return (
    <>
      <ConfirmDialog />
      <DialogHeader>
        <h2>{`Edit ${user.email}`}</h2>
      </DialogHeader>
      <DialogContent>
        <FormControlsContainer>
          <FormGroup label="Groups">
            {(id) => (
              <MultiSelect
                options={allGroups}
                selectedOptionIds={groupIds}
                onChange={setGroupIds}
                showTokens
              />
            )}
          </FormGroup>
          <div css={tw`grid justify-items-end`}>
            <Switch
              label="Admin?"
              description="Admins can manage all users, groups, and collections"
              onCheckedChange={setIsOrgAdmin}
              checked={isOrgAdmin}
            />
          </div>
        </FormControlsContainer>
      </DialogContent>
      <DialogFooter>
        <div
          css={css`
            width: 100%;
            display: grid;
            grid-template-columns: auto auto;
          `}
        >
          <div>
            <MutateButton
              Component={DangerButton}
              result={disableUserResult}
              onClick={maybeDeleteUser}
            >
              Disable
            </MutateButton>
          </div>
          <div css={tw`text-right`}>
            <LinkButton onClick={onSuccessOrCancel}>Cancel</LinkButton>
            <MutateButton result={updateUserResult} onClick={save}>
              Save
            </MutateButton>
          </div>
        </div>
        <ErrorAlert
          title="Error disabling user"
          error={errorFromMutation(disableUserResult)}
        />
        <ErrorAlert
          title="Error updating user"
          error={errorFromMutation(updateUserResult)}
        />
      </DialogFooter>
    </>
  );
}

type Props = {
  user?: OrgUser;
  isOpen: boolean;
  onClose: () => void;
  organization: Org;
  allGroups: UserGroups;
  mutationOptions?: Pick<
    MutationHookOptions,
    'refetchQueries' | 'awaitRefetchQueries'
  >;
};

export const UserDialog = ({
  user,
  isOpen,
  onClose,
  organization,
  allGroups,
  mutationOptions,
}: Props) => {
  return (
    <Dialog width="small" isOpen={isOpen} onClose={onClose}>
      {user ? (
        <UpdateUser
          key={user.id}
          user={user}
          allGroups={allGroups}
          onSuccessOrCancel={onClose}
        />
      ) : (
        <AddUser
          organization={organization}
          allGroups={allGroups}
          onSuccessOrCancel={onClose}
          mutationOptions={mutationOptions}
        />
      )}
    </Dialog>
  );
};
