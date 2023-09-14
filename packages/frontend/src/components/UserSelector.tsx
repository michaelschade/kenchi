import { useMemo } from 'react';

import sortBy from 'lodash/sortBy';
import ReactSelect from 'react-select';

import useOrgMembers, {
  OrgMembersGroup as Group,
  OrgMembersUser as User,
} from '../graphql/useOrgMembers';

type UserOptionType = {
  type: 'User';
  value: string;
  label: string;
  disabled: boolean;
  user: User;
};
type GroupOptionType = {
  type: 'UserGroup';
  value: string;
  label: string;
  disabled: boolean;
  group: Group;
};

type OptionType = UserOptionType | GroupOptionType;

type UserSelectorProps = {
  id?: string;
  disabledIds?: string[];
  includeGroups?: boolean;
  onSelect: (userOrGroup: User | Group) => void;
};

export default function UserSelector({
  disabledIds = [],
  includeGroups = false,
  onSelect,
  id,
}: UserSelectorProps) {
  const { data: orgMembers, loading: orgMembersLoading } = useOrgMembers();

  const selectOptions = useMemo(() => {
    if (!orgMembers) {
      return [];
    }
    const userOptions = orgMembers.users.edges.map(
      (e): UserOptionType => ({
        type: 'User',
        value: e.node.id,
        label: e.node.name
          ? `${e.node.name} (${e.node.email})`
          : `${e.node.email}`,
        disabled: disabledIds.some((id) => id === e.node.id),
        user: e.node,
      })
    );
    if (!includeGroups) {
      return sortBy(userOptions, 'label');
    }
    const groupOptions = orgMembers.userGroups.edges.map(
      (e): GroupOptionType => ({
        type: 'UserGroup',
        value: e.node.id,
        label: e.node.name,
        disabled: disabledIds.some((id) => id === e.node.id),
        group: e.node,
      })
    );

    return [
      { label: 'Groups', options: sortBy(groupOptions, 'label') },
      { label: 'Users', options: sortBy(userOptions, 'label') },
    ];
  }, [includeGroups, orgMembers, disabledIds]);

  return (
    <ReactSelect<OptionType>
      inputId={id}
      isSearchable
      isLoading={orgMembersLoading}
      options={selectOptions}
      isOptionDisabled={(o) => o.disabled}
      placeholder={`Add users${includeGroups ? ' or groups' : ''}…`}
      value={null}
      onChange={(option) => {
        if (!option || !('type' in option)) {
          throw new Error('Impossible');
        }
        if (!orgMembers) {
          throw new Error('Selected option before orgMembers loaded');
        }
        const isGroup = option.type === 'UserGroup';
        const userOrGroup = isGroup
          ? orgMembers?.userGroups.edges.find(
              (e) => e.node.id === option.value
            )!.node
          : orgMembers?.users.edges.find((e) => e.node.id === option.value)!
              .node;
        onSelect(userOrGroup);
      }}
      // This menuPortalTarget prop and pointerEvents: 'auto' constitute a bit
      // of a hack. We must portal the ReactSelect with menuPortalTarget in
      // order for the open menu to be able to extend beyond the bounds of the
      // Dailog. And we must set pointerEvents: 'auto' to allow interaction
      // with the open menu, since our Dialog uses Radix Dialog, which
      // prevents interaction outside of itself (as is the correct behavior of
      // a modal dialog). Since the menu content is portalled, it's outside of
      // the Dialog's DOM tree.
      // TODO(dave): remove that hack if/when we switch to Radix Select.
      menuPortalTarget={document.body}
      styles={{
        menuPortal: (base) => ({
          ...base,
          pointerEvents: 'auto',
        }),
        placeholder: (base) => ({ ...base, whiteSpace: 'nowrap' }),
      }}
    />
  );
}
