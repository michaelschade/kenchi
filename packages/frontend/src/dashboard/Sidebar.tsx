import {
  MenuContainer,
  MenuItemLink,
  MenuItemList,
  MenuSection,
} from '@kenchi/ui/lib/Menu';

import {
  useHasOrgPermission,
  useHasSomeCollectionPermission,
} from '../graphql/useSettings';

export default function Sidebar() {
  const canManageUsers = useHasOrgPermission('manage_users');
  const canManageSpaces = useHasOrgPermission('manage_spaces');
  const canManageSuggestions =
    useHasSomeCollectionPermission('review_suggestions');

  // TODO(permissions): non-org-user upgrade page, probably a big "let's invite
  // people!"

  return (
    <MenuContainer>
      <MenuItemLink to="/dashboard/quickstart">Quickstart</MenuItemLink>
      <MenuSection title="Content">
        <MenuItemList>
          <MenuItemLink to="/dashboard/playbooks">Playbooks</MenuItemLink>
          <MenuItemLink to="/dashboard/snippets">Snippets</MenuItemLink>
          {canManageSuggestions && (
            <MenuItemLink to="/dashboard/suggestions">Suggestions</MenuItemLink>
          )}
        </MenuItemList>
      </MenuSection>
      <MenuSection title="Organization">
        <MenuItemLink to="/dashboard/collections">Collections</MenuItemLink>
        {(canManageUsers || canManageSpaces) && (
          <MenuItemList>
            {canManageSpaces && (
              <MenuItemLink to="/dashboard/spaces">Spaces</MenuItemLink>
            )}
            <MenuItemLink to="/dashboard/users">Users</MenuItemLink>
            <MenuItemLink to="/dashboard/groups">Groups</MenuItemLink>
          </MenuItemList>
        )}
      </MenuSection>
    </MenuContainer>
  );
}
