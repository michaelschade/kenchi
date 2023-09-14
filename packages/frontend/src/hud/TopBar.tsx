import { css } from '@emotion/react';
import { faCaretDown, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { MenuOpener } from '@kenchi/ui/lib/DropdownMenu';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { SpaceFragment } from '../graphql/generated';
import {
  TopBarContainer,
  TopBarContainerButton,
} from '../topBar/TopBarContainer';
import { TopBarSpacesMenu } from '../topBar/TopBarSpacesMenu';
import { trackEvent } from '../utils/analytics';
import { magicSpaces } from '../utils/spaceUrl';
import useMessageRouter from '../utils/useMessageRouter';
import { recomputeHeight } from './utils';

const spaceButtonStyles = ({ colors }: KenchiTheme) => css`
  color: ${colors.logomark};
  max-width: 192px;
  ${tw`text-xs border-0 bg-transparent font-bold py-1 px-3 -ml-3 flex gap-1 items-center hover:cursor-pointer transition outline-none opacity-70 hover:opacity-100 focus:opacity-100`}
`;

const spaceNameStyles = ({ colors }: KenchiTheme) => css`
  white-space: nowrap;
  overflow: clip;
  text-overflow: ellipsis;
`;

const menuStyles = css`
  max-height: 180px;
  overflow-x: clip;
  overflow-y: scroll;
`;

export const defaultSpaceKey = 'defaultHudSpace';
export default function TopBar({
  spaces,
  currentSpaceId,
  onSpaceSelect,
}: {
  spaces: SpaceFragment[] | null;
  currentSpaceId: string;
  onSpaceSelect: (spaceId: string) => void;
}) {
  const router = useMessageRouter<'hud'>();

  const currentSpace = spaces?.find(
    (space: SpaceFragment) => space.staticId === currentSpaceId
  );
  const spacesMenu = () => {
    if (!spaces) {
      return <LoadingSpinner />;
    } else if (spaces.length === 0) {
      return null;
    } else {
      const spaceName =
        currentSpace?.name ??
        magicSpaces[currentSpaceId]?.name ??
        magicSpaces.__ALL__.name;
      return (
        <MenuOpener
          menuContent={
            <div id="hud-spaces-menu" css={menuStyles}>
              <TopBarSpacesMenu
                spaces={spaces}
                currentSpaceId={currentSpaceId}
                onValueChange={onSpaceSelect}
              />
            </div>
          }
          onOpenChange={async (open) => {
            trackEvent({
              category: 'hud_top_bar',
              action: open ? 'open_spaces_menu' : 'close_spaces_menu',
            });
          }}
        >
          <button
            css={spaceButtonStyles}
            onClick={() => {
              // Hacky fix. Menu might be opened while the HUD is small.
              // Force to a larger size on menu open.
              router.sendCommand('pageScript', 'hud:updateHeight', {
                height: recomputeHeight(),
              });
            }}
          >
            <span css={spaceNameStyles}>{spaceName}</span>
            <FontAwesomeIcon icon={faCaretDown} />
          </button>
        </MenuOpener>
      );
    }
  };
  return (
    <TopBarContainer
      logoGroupContent={spacesMenu()}
      buttonGroupContent={
        <TopBarContainerButton
          icon={faTimes}
          onClick={() => {
            router.sendCommand('pageScript', 'hud:hide');
          }}
        />
      }
    />
  );
}
