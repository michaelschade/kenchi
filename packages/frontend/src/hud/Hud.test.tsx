import userEvent from '@testing-library/user-event';

import collectionFactory from '../test/factories/collection';
import spaceFactory from '../test/factories/space';
import userFactory from '../test/factories/user';
import { render, waitFor } from '../testUtils';
import Hud from './Hud';
import { defaultSpaceKey } from './TopBar';

const spaceWithContent = spaceFactory
  .containingCollections(collectionFactory.buildList(1))
  .build();
const emptySpace = spaceFactory.build();
const user = userFactory.withSpaces([spaceWithContent, emptySpace]).build();
const localStorage = global.localStorage;

beforeEach(() => localStorage.clear());

describe('filtering by space', () => {
  it('filters empty spaces from the top bar menu', async () => {
    const { findByText, queryByText } = render(<Hud></Hud>, {
      apolloResolvers: {
        Viewer: { user: () => user },
      },
    });

    expect(await findByText('Show everything')).toBeInTheDocument();
    // This is a workaround https://github.com/radix-ui/primitives/issues/1220
    // It should just be userEvent.click(await findByText('Show everything'));
    userEvent.type(await findByText('Show everything'), '{arrowdown}');
    expect(await findByText(spaceWithContent.name)).toBeInTheDocument();
    expect(queryByText(emptySpace.name)).toBeNull();
  });

  it('displays an empty space when it is selected as the default', async () => {
    global.localStorage.setItem(defaultSpaceKey, emptySpace.staticId);
    const { findByText, findByRole } = render(<Hud></Hud>, {
      apolloResolvers: {
        Viewer: { user: () => user },
      },
    });

    expect(await findByText(emptySpace.name)).toBeInTheDocument();

    // This is a workaround https://github.com/radix-ui/primitives/issues/1220
    // It should just be userEvent.click(<trigger>));
    userEvent.type(await findByText(emptySpace.name), '{arrowdown}');
    expect(
      await findByRole('menuitemradio', { name: emptySpace.name })
    ).toBeInTheDocument();
  });
});

it('saves the space to local storage on selection', async () => {
  const { findByText } = render(<Hud></Hud>, {
    apolloResolvers: {
      Viewer: { user: () => user },
    },
  });

  // This is a workaround https://github.com/radix-ui/primitives/issues/1220
  // It should just be userEvent.click(await findByText('Show everything'));
  userEvent.type(await findByText('Show everything'), '{arrowdown}');

  userEvent.click(await findByText(spaceWithContent.name));
  await waitFor(() =>
    expect(localStorage.getItem(defaultSpaceKey)).toEqual(
      spaceWithContent.staticId
    )
  );
});

it('shows a sign in prompt when the user is logged out', async () => {
  const { findByText } = render(<Hud></Hud>, {
    apolloResolvers: {
      Viewer: { user: () => null },
    },
  });

  expect(await findByText(/Sign in with Google/)).toBeInTheDocument();
});
