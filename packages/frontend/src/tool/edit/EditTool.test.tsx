import {
  ToolFragment,
  UpdateToolMutationVariables,
} from '../../graphql/generated';
import toolFactory from '../../test/factories/tool';
import { fireEvent, render, waitFor } from '../../testUtils';
import EditTool from './EditTool';

test('allows editing', async () => {
  let mutationCalled = false;
  const tool = toolFactory.build();
  const newToolName = 'My New Tool';
  const updateVariables: UpdateToolMutationVariables = {
    id: tool.id,
    toolData: {
      name: newToolName,
      component: tool.component,
      collectionId: tool.collection?.id || null,
      branchType: tool.branchType,
      description: tool.description,
      inputs: tool.inputs,
      icon: tool.icon,
      configuration: tool.configuration,
      keywords: [],
      majorChangeDescription: tool.majorChangeDescription,
    },
  };

  let onUpdate: (newTool: ToolFragment) => void;
  const onUpdateDone = new Promise<void>((resolve) => {
    onUpdate = (newTool: ToolFragment) => {
      expect(newTool.name).toEqual(newToolName);
      resolve();
    };
  });

  // No I don't know why we need this
  const fail = () => {
    throw new Error('Should not be called');
  };
  const { findByLabelText, getByText } = render(
    <EditTool
      id={tool.staticId}
      onUpdate={onUpdate!}
      onBack={fail}
      onDelete={fail}
      topLevel={false}
      editType="publishOnly"
    />,
    {
      apolloMocks: {
        LatestNode: () => tool,
      },
      apolloResolvers: {
        Mutation: {
          updateTool: (_, args) => {
            expect(args).toEqual(updateVariables);
            mutationCalled = true;
            return { tool: { ...tool, name: newToolName } };
          },
        },
      },
    }
  );

  const name = await findByLabelText('Name');
  expect(name).toBeInTheDocument();

  // We can't actually test the editor like this because it doesn't support for contentEditable
  // See https://github.com/jsdom/jsdom/issues/1670

  fireEvent.change(name, { target: { value: newToolName } });

  const save = getByText('Publish');
  expect(save).toBeInTheDocument();

  fireEvent.click(save);

  await waitFor(() => expect(mutationCalled).toBe(true));

  await onUpdateDone;
});
