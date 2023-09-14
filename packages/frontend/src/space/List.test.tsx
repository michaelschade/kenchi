import { SelectableList } from '../list/SelectableList';
import collectionFactory from '../test/factories/collection';
import workflowFactory from '../test/factories/workflow';
import { render } from '../testUtils';
import List from './List';
import { SpaceSettingsProvider } from './useSpaceSettings';

test('shows no workflows', async () => {
  const { findByText } = render(
    <SpaceSettingsProvider data={null} staticId="abc" collectionIds={null}>
      <List />
    </SpaceSettingsProvider>,
    {
      apolloMocks: {
        CollectionConnection: () => ({ edges: [] }),
      },
    }
  );

  const linkElement = await findByText(
    /You don't have any snippets or playbooks yet/i
  );
  expect(linkElement).toBeInTheDocument();
});

test('shows a workflow', async () => {
  const workflow = workflowFactory.build();
  const { findByText } = render(
    <SelectableList<{}> actionKeys={[]}>
      <SpaceSettingsProvider data={null} staticId="abc" collectionIds={null}>
        <List />
      </SpaceSettingsProvider>
    </SelectableList>,
    {
      apolloResolvers: {
        User: {
          collections: (_user, { since }) => ({
            edges: [
              {
                __typename: 'CollectionEdge',
                node: collectionFactory.build({
                  tools: {
                    __typename: 'CollectionTools_Connection',
                    edges: [],
                    removed: [],
                  },
                  workflows: {
                    __typename: 'CollectionWorkflows_Connection',
                    edges: since
                      ? []
                      : [{ __typename: 'WorkflowLatestEdge', node: workflow }],
                    removed: [],
                  },
                }),
              },
            ],
          }),
        },
      },
    }
  );

  const playbookEl = await findByText(workflow.name);

  expect(playbookEl).toBeInTheDocument();
});
