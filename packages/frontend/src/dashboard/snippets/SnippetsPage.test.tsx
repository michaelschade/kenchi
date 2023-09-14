import collectionFactory from '../../test/factories/collection';
import toolFactory from '../../test/factories/tool';
import userFactory from '../../test/factories/user';
import { render } from '../../testUtils';
import SnippetsPage from './SnippetsPage';

const tools = toolFactory.buildList(21);
const user = userFactory.build({
  collections: {
    edges: [
      {
        node: collectionFactory.withTools(tools).build(),
        __typename: 'CollectionEdge',
      },
    ],
  },
});

it('displays the first page of results by default', async () => {
  const { findByText, queryByText } = render(<SnippetsPage />, {
    apolloResolvers: {
      Viewer: {
        user: () => user,
      },
      Query: {
        versionedNode: (staticId) => {
          return tools.find((tool) => tool.staticId === staticId);
        },
      },
    },
  });

  for (const tool of tools.slice(0, 20)) {
    const toolElement = await findByText(tool.name);
    expect(toolElement).toBeInTheDocument();
  }

  const toolElementFromSecondPage = queryByText(tools[20].name);
  expect(toolElementFromSecondPage).not.toBeInTheDocument();
});

// render initial path does not support a query string.
// Skipping this test for now, we can re-enable once we debug the issue
// with initialPath
it.skip('displays paginated results', async () => {
  const { findByText, queryByText } = render(<SnippetsPage />, {
    initialPath: '/dashboard/snippets?page=2',
    apolloResolvers: {
      Viewer: {
        user: () => user,
      },
      Query: {
        versionedNode: (staticId) => {
          return tools.find((tool) => tool.staticId === staticId);
        },
      },
    },
  });

  const toolElementFromSecondPage = findByText(tools[20].name);
  expect(toolElementFromSecondPage).toBeInTheDocument();

  for (const tool of tools.slice(0, 20)) {
    const toolElement = queryByText(tool.name);
    expect(toolElement).not.toBeInTheDocument();
  }
});
