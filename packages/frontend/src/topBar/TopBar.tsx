import { useState } from 'react';

import { css } from '@emotion/react';
import {
  faCaretDown,
  faCog,
  faPlus,
  faQuestion,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHistory } from 'react-router-dom';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { MenuOpener } from '@kenchi/ui/lib/DropdownMenu';

import CreationMenu from '../components/CreationMenu';
import HotkeysHelp from '../components/HotkeysHelp';
import { CustomModal, PageModal } from '../components/Modals';
import { SpaceFragment } from '../graphql/generated';
import UserSettings from '../settings/UserSettings';
import CreateOrgModal from '../space/createOrg/Modal';
import { trackEvent } from '../utils/analytics';
import { getSpaceUrl, magicSpaces, saveSpaceId } from '../utils/spaceUrl';
import GetInTouch from './GetInTouch';
import { TopBarContainer, TopBarContainerButton } from './TopBarContainer';
import { TopBarHelpMenu } from './TopBarHelpMenu';
import { TopBarMainMenu } from './TopBarMainMenu';
import { TopBarSpacesMenu } from './TopBarSpacesMenu';

const spaceNameStyles = ({ colors }: KenchiTheme) => css`
  color: ${colors.logomark};

  ${tw`text-xs border-0 bg-transparent font-bold py-1 px-3 -ml-3 flex gap-1 items-center hover:cursor-pointer transition outline-none opacity-70 hover:opacity-100 focus:opacity-100`}
`;

type TopBarProps = {
  currentSpaceId: string;
  // TODO: make a GQL fragment for the spaces data we need
  spaces: SpaceFragment[];
};

export const TopBar = ({ currentSpaceId, spaces }: TopBarProps) => {
  const history = useHistory();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showGetInTouch, setShowGetInTouch] = useState(false);

  const spaceName =
    spaces.length > 0
      ? spaces.find((space) => space.staticId === currentSpaceId)?.name ||
        magicSpaces[currentSpaceId]?.name ||
        magicSpaces.__ALL__.name
      : null;

  return (
    <TopBarContainer
      logoGroupContent={
        spaceName && (
          <MenuOpener
            menuContent={
              <TopBarSpacesMenu
                spaces={spaces}
                currentSpaceId={currentSpaceId}
                onValueChange={(spaceId) => {
                  saveSpaceId(spaceId);
                  history.push(getSpaceUrl(spaceId));
                }}
              />
            }
          >
            <button css={spaceNameStyles}>
              {spaceName}
              <FontAwesomeIcon icon={faCaretDown} />
            </button>
          </MenuOpener>
        )
      }
      buttonGroupContent={
        <>
          <MenuOpener
            menuContent={<CreationMenu analyticsCategory="top_bar" />}
            onOpenChange={(open) => {
              trackEvent({
                category: 'top_bar',
                action: open ? 'open_creation_menu' : 'close_creation_menu',
              });
            }}
          >
            <TopBarContainerButton icon={faPlus} />
          </MenuOpener>
          <CreateOrgModal
            isOpen={showCreateOrg}
            onClose={() => setShowCreateOrg(false)}
          />
          <PageModal
            isOpen={showUserSettings}
            onBack={() => setShowUserSettings(false)}
          >
            <UserSettings onBack={() => setShowUserSettings(false)} />
          </PageModal>
          <MenuOpener
            menuContent={
              <TopBarMainMenu
                onCreateOrg={() => setShowCreateOrg(true)}
                onShowUserSettings={() => setShowUserSettings(true)}
              />
            }
            onOpenChange={(open) => {
              trackEvent({
                category: 'top_bar',
                action: open ? 'open_main_menu' : 'close_main_menu',
              });
            }}
          >
            <TopBarContainerButton icon={faCog} />
          </MenuOpener>
          <CustomModal
            isOpen={showKeyboardShortcuts}
            onBack={() => setShowKeyboardShortcuts(false)}
            title="Guide to keyboard shortcuts"
          >
            <HotkeysHelp />
          </CustomModal>
          <CustomModal
            isOpen={showGetInTouch}
            onBack={() => setShowGetInTouch(false)}
            title="Get in touch with us"
          >
            <GetInTouch />
          </CustomModal>
          <MenuOpener
            menuContent={
              <TopBarHelpMenu
                onOpenKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
                onOpenGetInTouch={() => setShowGetInTouch(true)}
              />
            }
            onOpenChange={(open) => {
              trackEvent({
                category: 'top_bar',
                action: open ? 'open_help_menu' : 'close_help_menu',
              });
            }}
          >
            <TopBarContainerButton icon={faQuestion} />
          </MenuOpener>
        </>
      }
    />
  );
};
