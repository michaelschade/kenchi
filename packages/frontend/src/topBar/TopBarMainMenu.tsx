import {
  faTasks,
  faUserCog,
  faUsersCog,
} from '@fortawesome/pro-solid-svg-icons';

import { MenuItemLink, MenuSection } from '@kenchi/ui/lib/DropdownMenu';

import { AuthTypeEnum } from '../graphql/generated';
import useSettings, {
  useHasOrgPermission,
  useHasSomeCollectionPermission,
} from '../graphql/useSettings';
import { hasVisibleOrg } from '../graphql/utils';
import { DomainSettings } from '../topBar/DomainSettings';
import { isExtension } from '../utils';
import { trackEvent } from '../utils/analytics';

type Props = {
  onCreateOrg: () => void;
  onShowUserSettings: () => void;
};

export const TopBarMainMenu = ({ onCreateOrg, onShowUserSettings }: Props) => {
  const settings = useSettings();
  const canManageUsers = useHasOrgPermission('manage_users');
  const canManageSuggestions =
    useHasSomeCollectionPermission('review_suggestions');

  return (
    <>
      <DomainSettings />
      {canManageSuggestions || canManageUsers ? (
        <MenuSection title="Manage content" icon={faTasks}>
          <MenuItemLink
            to="/dashboard/collections"
            target={isExtension() ? '_blank' : undefined}
            onClick={() => {
              trackEvent({
                category: 'top_bar',
                action: 'click_kenchi_menu_collections',
                label: 'Click Kenchi menu collections link',
              });
            }}
          >
            Collections
          </MenuItemLink>
          {canManageSuggestions && (
            <MenuItemLink
              to="/dashboard/suggestions"
              target={isExtension() ? '_blank' : undefined}
              onClick={() => {
                trackEvent({
                  category: 'top_bar',
                  action: 'click_kenchi_menu_suggestions',
                  label: 'Click Kenchi menu suggestions link',
                });
              }}
            >
              Suggestions
            </MenuItemLink>
          )}
          {canManageUsers && (
            <MenuItemLink
              to="/dashboard/spaces"
              target={isExtension() ? '_blank' : undefined}
              onClick={() => {
                trackEvent({
                  category: 'top_bar',
                  action: 'click_kenchi_menu_spaces',
                  label: 'Click Kenchi menu spaces link',
                });
              }}
            >
              Spaces
            </MenuItemLink>
          )}
        </MenuSection>
      ) : null}
      {!hasVisibleOrg(settings?.viewer) && (
        <MenuSection title="Settings" icon={faUsersCog}>
          <MenuItemLink
            onClick={() => {
              onCreateOrg();
              trackEvent({
                category: 'top_bar',
                action: 'click_kenchi_menu_create_org',
                label: 'Click Kenchi create org link',
              });
            }}
          >
            Invite your team to Kenchi
          </MenuItemLink>
        </MenuSection>
      )}
      {canManageUsers && (
        <MenuSection title="Manage team" icon={faUsersCog}>
          <MenuItemLink
            to="/dashboard/users"
            target={isExtension() ? '_blank' : undefined}
            onClick={() => {
              trackEvent({
                category: 'top_bar',
                action: 'click_kenchi_menu_users',
                label: 'Click Kenchi menu users link',
              });
            }}
          >
            Users
          </MenuItemLink>
          <MenuItemLink
            to="/dashboard/groups"
            target={isExtension() ? '_blank' : undefined}
            onClick={() => {
              trackEvent({
                category: 'top_bar',
                action: 'click_kenchi_menu_groups',
                label: 'Click Kenchi menu groups link',
              });
            }}
          >
            Groups
          </MenuItemLink>
        </MenuSection>
      )}
      <MenuSection title="My Kenchi" icon={faUserCog}>
        <MenuItemLink
          to="/dashboard/quickstart"
          target={isExtension() ? '_blank' : undefined}
          onClick={() => {
            trackEvent({
              category: 'top_bar',
              action: 'click_kenchi_menu_quickstart',
              label: 'Quickstart',
            });
          }}
        >
          Quickstart
        </MenuItemLink>
        <MenuItemLink to="/whats-new">What's new</MenuItemLink>
        <MenuItemLink onClick={() => onShowUserSettings()}>
          Settings
        </MenuItemLink>
        {settings?.viewer.session?.type === AuthTypeEnum.loginAs && (
          <MenuItemLink to="/login-as/return">Logout (as)</MenuItemLink>
        )}
      </MenuSection>
    </>
  );
};
