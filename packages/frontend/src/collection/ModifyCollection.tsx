import { Fragment, useMemo } from 'react';

import { MutationResult } from '@apollo/client';
import { css } from '@emotion/react';
import {
  faExclamationTriangle,
  faTimesCircle,
  faUser,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import update from 'immutability-helper';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';

import Alert from '@kenchi/ui/lib/Alert';
import { LinkButton } from '@kenchi/ui/lib/Button';
import { BaseColors, KenchiTheme } from '@kenchi/ui/lib/Colors';
import { PickerButton } from '@kenchi/ui/lib/EmojiPicker';
import {
  Form,
  FormGroup,
  InputGroup,
  Select,
  SelectOptions,
  TextAreaGroup,
} from '@kenchi/ui/lib/Form';
import { Link, linkStyle } from '@kenchi/ui/lib/Text';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import ErrorAlert from '../components/ErrorAlert';
import { MutateButton } from '../components/MutateButton';
import UserSelector from '../components/UserSelector';
import { errorFromMutation } from '../graphql/errorFromMutation';
import {
  CollectionAclInput,
  CollectionFragment,
  CollectionPermissionEnum,
  KenchiErrorFragment,
  OrgMembersQuery,
  UpdateCollectionMutationVariables,
} from '../graphql/generated';
import useOrgMembers from '../graphql/useOrgMembers';
import useSettings from '../graphql/useSettings';
import { hasVisibleOrg } from '../graphql/utils';
import { faKenchiCity } from '../utils';
import useCollections from './useCollections';

const splitForm = css`
  display: grid;
  grid-template-columns: auto min-content;
  gap: 0.75rem;
`;

const iconStyle = css`
  font-size: 0.8em;
  top: 6px !important;
`;

type ModifyCollectionProps = {
  collection: CollectionFragment | null;
  onBack: () => void;
  mutate: (data: UpdateCollectionMutationVariables['collectionData']) => void;
  mutationResult: MutationResult<{
    modify: {
      collection: CollectionFragment | null;
      error: KenchiErrorFragment | null;
    };
  }>;
  onSelectExisting?: (id: string) => void;
  inputFieldsWrapper?: React.ComponentType;
  buttonWrapper?: React.ComponentType;
};

type AclRowType = {
  userGroupId?: string;
  userId?: string;
  permission: CollectionPermissionEnum | undefined;
};

const aclGrid = ({ colors }: KenchiTheme) => css`
  margin-top: 10px;
  display: grid;
  grid-template-columns: auto minmax(150px, max-content) min-content;
  gap: 0.4rem 0.4rem;
  font-size: 0.9rem;
  align-items: center;
  word-break: break-word;
  color: ${colors.gray[12]};
  .section {
    grid-column: 1 / span 3;
    color: ${colors.gray[11]};
    font-weight: 500;
    margin-top: 0.5rem;
  }
`;

type OrgMembers = OrgMembersQuery['viewer']['organization'];

type AclRowProps = {
  orgMembers: OrgMembers | undefined;
  acl: AclRowType;
  onDelete: () => void;
  onChangePermission: (permission: CollectionPermissionEnum) => void;
};
function AclRow({
  acl,
  orgMembers,
  onDelete,
  onChangePermission,
}: AclRowProps) {
  const group = acl.userGroupId
    ? orgMembers?.userGroups.edges.find((ug) => ug.node.id === acl.userGroupId)
        ?.node
    : undefined;
  const user = acl.userId
    ? orgMembers?.users.edges.find((u) => u.node.id === acl.userId)?.node
    : undefined;

  return (
    <>
      <div className="name">
        {group ? (
          <>{group?.name || acl.userGroupId}</>
        ) : (
          <>{user?.name || user?.email || acl.userId}</>
        )}
      </div>
      <PermissionSelect
        value={acl.permission}
        onChange={(v) => onChangePermission(v!)}
      />
      <div>
        <Link onClick={onDelete}>
          <FontAwesomeIcon icon={faTimesCircle} />
        </Link>
      </div>
    </>
  );
}

function PermissionSelect({
  value,
  onChange,
  includeCantSee,
}: {
  value: CollectionPermissionEnum | null | undefined;
  onChange: (value: CollectionPermissionEnum | null) => void;
  includeCantSee?: boolean;
}) {
  const permissionOptions: SelectOptions = [];
  if (!value && !includeCantSee) {
    permissionOptions.push({
      value: '',
      label: '',
    });
  }
  permissionOptions.push(
    {
      value: CollectionPermissionEnum.admin,
      label: 'Manage collection',
    },
    {
      value: CollectionPermissionEnum.publisher,
      label: 'Create and edit',
    },
    {
      value: CollectionPermissionEnum.viewer,
      label: 'View',
    }
  );
  if (includeCantSee) {
    permissionOptions.push({
      value: '',
      label: 'No access',
    });
  }

  return (
    <Select
      size="small"
      value={value || ''}
      options={permissionOptions}
      onSelect={(value) =>
        onChange((value as CollectionPermissionEnum) || null)
      }
    />
  );
}

function conditionalWrapper(
  Wrapper: React.ComponentType | undefined,
  content: React.ReactNode
): React.ReactNode {
  if (!Wrapper) {
    return content;
  }
  return <Wrapper>{content}</Wrapper>;
}

export default function ModifyCollection({
  collection,
  onBack,
  mutate,
  mutationResult,
  onSelectExisting,
  inputFieldsWrapper: InputFieldsWrapper,
  buttonWrapper: ButtonWrapper,
}: ModifyCollectionProps) {
  const nameState = useFormState<string>(collection?.name, '');
  const descriptionState = useFormState<string>(collection?.description, '');
  const iconState = useFormState<string | null>(collection?.icon, '');
  const aclRowsState = useFormState<AclRowType[]>(
    sortBy(
      collection?.acl.map((acl) => ({
        userGroupId: acl.userGroup?.id,
        userId: acl.user?.id,
        permission: acl.permissions[0] || null,
      })),
      ['userGroupId', 'userId']
    ),
    []
  );
  const defaultPermissionState = useFormState<
    CollectionPermissionEnum | null | undefined
  >(
    collection ? collection.defaultPermissions[0] || null : undefined,
    CollectionPermissionEnum.publisher
  );

  const { collections } = useCollections('cache-first');

  const { data: orgMembers } = useOrgMembers();
  const settings = useSettings();

  const disabledIds = useMemo(
    () => aclRowsState.value.map((row) => row.userGroupId || row.userId!),
    [aclRowsState.value]
  );

  const aclRowSections = groupBy(aclRowsState.value, (row) =>
    row.userGroupId ? 'groups' : 'users'
  );

  // TODO(permissions): Allow non-org users to invite people to their
  // collections (need email address type-ahead, invites, and probably a few
  // other things)
  const belongsToOrg = hasVisibleOrg(settings?.viewer);

  const onClick = () => {
    if (!mutationResult.loading) {
      let defaultPermissions: CollectionPermissionEnum[] | undefined;
      if (defaultPermissionState.value === null) {
        defaultPermissions = [];
      } else if (defaultPermissionState.value === undefined) {
        defaultPermissions = undefined;
      } else {
        defaultPermissions = [defaultPermissionState.value];
      }

      if (aclRowsState.value.some((row) => !row.permission)) {
        // TODO: error
        return;
      }

      let acl: CollectionAclInput[];
      if (belongsToOrg) {
        acl = aclRowsState.value.map((row) => ({
          userGroupId: row.userGroupId,
          userId: row.userId,
          permissions: [row.permission!],
        }));
      } else {
        if (!settings?.viewer.user) {
          // TODO: loading of some kind
          return;
        }
        acl = [
          {
            userId: settings.viewer.user.id,
            permissions: [CollectionPermissionEnum.admin],
          },
        ];
      }

      mutate({
        name: nameState.value,
        icon: iconState.value,
        description: descriptionState.value,
        defaultPermissions,
        acl,
      });
    }
  };

  let existingCollectionError;
  if (onSelectExisting) {
    const existingCollection = collections?.find(
      (c) => c.name.toLowerCase() === nameState.value.toLowerCase()
    );
    if (existingCollection) {
      existingCollectionError = (
        <Alert
          primaryColor={BaseColors.warning}
          title={`Collection already exists`}
          icon={
            <FontAwesomeIcon icon={faExclamationTriangle} css={iconStyle} />
          }
          containerStyle={css`
            margin-bottom: 15px;
          `}
          description={
            <>
              A collection named "{existingCollection.name}" already exists.
              Would you like to{' '}
              <span
                css={(theme) => linkStyle(theme)}
                onClick={() => onSelectExisting(existingCollection.id)}
              >
                select it instead of creating a new collection
              </span>
              ?
            </>
          }
        />
      );
    }
  }

  return (
    <>
      {conditionalWrapper(
        InputFieldsWrapper,
        <Form>
          <div css={splitForm}>
            <InputGroup
              label="Collection name"
              value={nameState.value}
              autoFocus
              onChange={(e) => nameState.set(e.target.value)}
            />
            <FormGroup label="Icon">
              {(id) => (
                <PickerButton
                  id={id}
                  initialEmoji={iconState.value || ''}
                  onSelect={(icon) => iconState.set(icon)}
                  style={{ display: 'block' }}
                />
              )}
            </FormGroup>
          </div>
          <TextAreaGroup
            label="Description"
            value={descriptionState.value}
            onChange={(e) => descriptionState.set(e.target.value)}
          />
          {existingCollectionError}
          {belongsToOrg && (
            <FormGroup label="Sharing">
              {(id) => (
                <>
                  <UserSelector
                    id={id}
                    disabledIds={disabledIds}
                    includeGroups
                    onSelect={(userOrGroup) => {
                      const isGroup = userOrGroup.__typename === 'UserGroup';
                      aclRowsState.set([
                        {
                          userGroupId: isGroup ? userOrGroup.id : undefined,
                          userId: isGroup ? undefined : userOrGroup.id,
                          permission: undefined,
                        },
                        ...aclRowsState.value,
                      ]);
                    }}
                  />
                  <div css={aclGrid}>
                    {Object.keys(aclRowSections).map((section) => {
                      const rows = aclRowSections[section];
                      return (
                        <Fragment key={section}>
                          <div className="section">
                            {section === 'groups' ? (
                              <>
                                <FontAwesomeIcon
                                  icon={faUsers}
                                  fixedWidth
                                  size="sm"
                                />{' '}
                                Groups
                              </>
                            ) : null}
                            {section === 'users' ? (
                              <>
                                <FontAwesomeIcon
                                  icon={faUser}
                                  fixedWidth
                                  size="sm"
                                />{' '}
                                Users
                              </>
                            ) : null}
                          </div>
                          {rows.map((acl) => {
                            const i = aclRowsState.value.indexOf(acl);
                            return (
                              <AclRow
                                key={acl.userGroupId || acl.userId}
                                orgMembers={orgMembers}
                                acl={acl}
                                onDelete={() =>
                                  aclRowsState.set(
                                    update(aclRowsState.value, {
                                      $splice: [[i, 1]],
                                    })
                                  )
                                }
                                onChangePermission={(permission) =>
                                  aclRowsState.set(
                                    update(aclRowsState.value, {
                                      [i]: { $merge: { permission } },
                                    })
                                  )
                                }
                              />
                            );
                          })}
                        </Fragment>
                      );
                    })}
                    <div className="section">
                      <FontAwesomeIcon
                        icon={faKenchiCity}
                        fixedWidth
                        size="sm"
                      />{' '}
                      {collection?.organization?.name ||
                        settings?.viewer.organization?.name ||
                        'Org defaults'}
                    </div>
                    <div className="name">
                      {aclRowsState.value.length ? 'Everyone else' : 'Everyone'}
                    </div>
                    <PermissionSelect
                      value={defaultPermissionState.value}
                      onChange={defaultPermissionState.set}
                      includeCantSee
                    />
                  </div>
                </>
              )}
            </FormGroup>
          )}
        </Form>
      )}
      {conditionalWrapper(
        ButtonWrapper,
        <div className="w-100 text-right">
          <LinkButton onClick={onBack}>Cancel</LinkButton>
          <MutateButton
            onClick={onClick}
            result={mutationResult}
            disabled={
              nameState.value.trim() === '' ||
              aclRowsState.value.some((row) => !row.permission)
            }
          >
            {collection ? 'Save' : 'Create'}
          </MutateButton>
        </div>
      )}
      <ErrorAlert
        title="Error saving Collection"
        error={errorFromMutation(mutationResult)}
      />
    </>
  );
}
