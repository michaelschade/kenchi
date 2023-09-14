import collectionFactory, {
  PartialCollection,
} from '../../test/factories/collection';
import spaceFactory from '../../test/factories/space';
import userFactory, { PartialUser } from '../../test/factories/user';
import { render } from '../../testUtils';
import SpaceLayoutEditor from './SpaceLayoutEditor';
import { WidgetFormState } from './types';

jest.mock('react-dnd', () => {
  return {
    __esModule: true,
    useDrop: () => [{ isOver: false, canDrop: false, sameType: false }, null],
    useDrag: () => [{ isDragging: false }, null, jest.fn()],
  };
});
let selectedCollections: PartialCollection[];
let unselectedCollections: PartialCollection[];
let allCollections;
let user: PartialUser;
let collectionsFormState: WidgetFormState[];

beforeEach(() => {
  selectedCollections = collectionFactory.buildList(3);
  unselectedCollections = collectionFactory.buildList(3);
  allCollections = [...selectedCollections, ...unselectedCollections];
  user = userFactory
    .withSpaces([
      spaceFactory.containingCollections(selectedCollections).build(),
    ])
    .withCollections(allCollections)
    .build();
  collectionsFormState = selectedCollections.map((c) => ({
    type: 'collection',
    id: c.id,
    editing: false,
  }));
});
it('displays the space widgets', async () => {
  const { findByText, queryByText } = render(
    <SpaceLayoutEditor widgets={collectionsFormState} onChange={jest.fn()} />,
    {
      apolloResolvers: {
        Viewer: {
          user: () => user,
        },
      },
    }
  );
  for (const collection of selectedCollections) {
    const name = await findByText(collection.name);
    expect(name).toBeInTheDocument();
  }
  for (const collection of unselectedCollections) {
    const name = queryByText(collection.name);
    expect(name).not.toBeInTheDocument();
  }
});

it('editing a collection only shows unselected collections', async () => {
  const placeholderWidget = {
    type: 'collection-placeholder' as const,
    id: 'collection-placeholder-1',
    editing: true,
  };

  const { findByText, findAllByRole } = render(
    <SpaceLayoutEditor
      widgets={[...collectionsFormState, placeholderWidget]}
      onChange={jest.fn()}
    />,
    {
      apolloResolvers: {
        Viewer: {
          user: () => user,
        },
      },
    }
  );

  expect(await findByText('Select collection')).toBeInTheDocument();
  const options = await findAllByRole('option');
  expect(options).toHaveLength(unselectedCollections.length);
  const labelTexts = options.map((option) => option.textContent);
  expect(unselectedCollections.map((c) => c.name)).toEqual(
    expect.arrayContaining(labelTexts)
  );
});
