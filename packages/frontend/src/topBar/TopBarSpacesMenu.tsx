import sortBy from 'lodash/sortBy';

import { MenuItemRadio, MenuRadioGroup } from '@kenchi/ui/lib/DropdownMenu';

import { SpaceFragment } from '../graphql/generated';
import { magicSpaces } from '../utils/spaceUrl';

type Props = {
  currentSpaceId: string;
  spaces: SpaceFragment[];
  onValueChange: (spaceId: string) => void;
};

export const TopBarSpacesMenu = ({
  currentSpaceId,
  spaces,
  onValueChange,
}: Props) => {
  return (
    <MenuRadioGroup value={currentSpaceId} onValueChange={onValueChange}>
      <MenuItemRadio
        truncate
        disabled={currentSpaceId === '__ALL__'}
        active={currentSpaceId === '__ALL__'}
        value="__ALL__"
      >
        {magicSpaces.__ALL__.name}
      </MenuItemRadio>

      {sortBy(spaces, [(space) => space.name.toLocaleLowerCase()]).map(
        (space) => {
          const isActive = space.staticId === currentSpaceId;
          return (
            <MenuItemRadio
              truncate
              key={space.staticId}
              disabled={isActive}
              active={isActive}
              value={space.staticId}
            >
              {space.name}
            </MenuItemRadio>
          );
        }
      )}
    </MenuRadioGroup>
  );
};
