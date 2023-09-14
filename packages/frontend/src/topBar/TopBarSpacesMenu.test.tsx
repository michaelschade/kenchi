import userEvent from '@testing-library/user-event';

import { MenuOpener } from '@kenchi/ui/lib/DropdownMenu';

import { SpaceFragment } from '../graphql/generated';
import spaceFactory from '../test/factories/space';
import { render, waitFor } from '../testUtils';
import { TopBarSpacesMenu } from './TopBarSpacesMenu';

describe(TopBarSpacesMenu, () => {
  const onValueChangeCallback = jest.fn();
  const renderTopBarSpacesMenu = (spaces: SpaceFragment[]) => {
    return render(
      // TopBarSpacesMenu most be rendered within root menu and content components
      // MenuOpener provides this context
      <MenuOpener
        open
        menuContent={
          <TopBarSpacesMenu
            spaces={spaces}
            currentSpaceId="__ALL__"
            onValueChange={onValueChangeCallback}
          />
        }
      />
    );
  };
  describe('sorting spaces', () => {
    it('sorts by name', async () => {
      const spaces = ['z last space', 'a first space', 'middle space'].map(
        (name) => spaceFactory.build({ name })
      );

      const { findAllByText } = renderTopBarSpacesMenu(spaces);

      const menuItemContent = (await findAllByText(/space/)).map(
        (menuItem) => menuItem.textContent
      );
      expect(menuItemContent).toEqual([
        'a first space',
        'middle space',
        'z last space',
      ]);
    });

    it('does not mutate the spaces collection', async () => {
      const firstSpace = spaceFactory.build({ name: 'a space' });
      const secondSpace = spaceFactory.build({ name: 'b space' });
      const spaces = [secondSpace, firstSpace];

      renderTopBarSpacesMenu(spaces);
      await waitFor(() => expect(spaces).toEqual([secondSpace, firstSpace]));
    });

    it('ignores case when sorting', async () => {
      // Case sensitive sorting would sort capital letters first
      const spaces = ['zb last space', 'a first space', 'Za middle space'].map(
        (name) => spaceFactory.build({ name })
      );

      const { findAllByText } = renderTopBarSpacesMenu(spaces);

      const menuItemContent = (await findAllByText(/space/)).map(
        (menuItem) => menuItem.textContent
      );
      expect(menuItemContent).toEqual([
        'a first space',
        'Za middle space',
        'zb last space',
      ]);
    });
  });

  describe('on space selection', () => {
    it('triggers the onValueChange callback', async () => {
      const spaces = spaceFactory.buildList(3);
      const spaceToSelect = spaces[2];
      const { findByText } = renderTopBarSpacesMenu(spaces);
      // Test renders menu auto-open so we can directly click on an item
      userEvent.click(await findByText(spaceToSelect.name));

      await waitFor(() =>
        expect(onValueChangeCallback).toBeCalledWith(spaceToSelect.staticId)
      );
    });
  });
});
