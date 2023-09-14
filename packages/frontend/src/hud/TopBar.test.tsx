import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import spaceFactory from '../test/factories/space';
import { render } from '../testUtils';
import TopBar from './TopBar';

const spaces = spaceFactory.buildList(3);
const localStorage = global.localStorage;

beforeEach(() => localStorage.clear());
it('shows a loading spinner when spaces is null', async () => {
  const { findByText } = render(
    <TopBar
      spaces={null}
      currentSpaceId={'__ALL__'}
      onSpaceSelect={jest.fn()}
    ></TopBar>
  );

  expect(await findByText('Loading…')).toBeInTheDocument();
});

it('does not show the spaces menu when spaces is empty', async () => {
  const { findByAltText, queryByText } = render(
    <TopBar
      spaces={[]}
      currentSpaceId={'ignored'}
      onSpaceSelect={jest.fn()}
    ></TopBar>
  );

  expect(await findByAltText('Kenchi logo')).toBeInTheDocument();
  expect(queryByText('Show everything')).toBeNull();
});

it('displays "Show everything" for all spaces', async () => {
  const { findByText } = render(
    <TopBar
      spaces={spaces}
      currentSpaceId={'__ALL__'}
      onSpaceSelect={jest.fn()}
    ></TopBar>
  );

  expect(await findByText('Show everything')).toBeInTheDocument();
});

it('selects the specified space', async () => {
  const spaceToSelect = spaces[2];

  const { findByText } = render(
    <TopBar
      spaces={spaces}
      currentSpaceId={spaceToSelect.staticId}
      onSpaceSelect={jest.fn()}
    ></TopBar>
  );

  expect(await findByText(spaceToSelect.name)).toBeInTheDocument();
});

it('selects all spaces when the saved space does not exist', async () => {
  const { findByText } = render(
    <TopBar
      spaces={spaces}
      currentSpaceId={'some-other-space-id'}
      onSpaceSelect={jest.fn()}
    ></TopBar>
  );

  expect(await findByText('Show everything')).toBeInTheDocument();
});

it('triggers the callback function on select', async () => {
  const spaceToSelect = spaces[2];
  const onSelectCallback = jest.fn();
  const { findByText } = render(
    <TopBar
      spaces={spaces}
      currentSpaceId={'some-other-space-id'}
      onSpaceSelect={onSelectCallback}
    ></TopBar>
  );

  // This is a workaround https://github.com/radix-ui/primitives/issues/1220
  // It should just be userEvent.click(await findByText('Show everything'));
  userEvent.type(await findByText('Show everything'), '{arrowdown}');

  userEvent.click(await findByText(spaceToSelect.name));
  await waitFor(() =>
    expect(onSelectCallback).toBeCalledWith(spaceToSelect.staticId)
  );
});
