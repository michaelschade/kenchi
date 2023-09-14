import userEvent from '@testing-library/user-event';

import { SlateNode } from '@kenchi/slate-tools/lib/types';

import mockMessageRouter from '../__mocks__/@michaelschade/kenchi-message-router';
import toolFactory from '../test/factories/tool';
import {
  clearMockMessageRouter,
  expectNoSentCommands,
  expectSentCommand,
} from '../test/helpers/messageRouter';
import { MockSearchProvider } from '../test/helpers/search';
import {
  expectNoSearchEvents,
  expectSearchEvent,
} from '../test/helpers/searchAnalytics';
import { fireEvent, render, waitFor } from '../testUtils';
import { isExtension } from '../utils';
import Tool from './Tool';

const isExtensionMock = isExtension as jest.MockedFunction<typeof isExtension>;
jest.mock('../utils/extension');

const toolWithoutInputs = toolFactory.build();

const toolWithInputsSlateNode: SlateNode = {
  type: 'paragraph',
  children: [
    { text: 'A ' },
    {
      type: 'variable',
      id: 'recipientFirstName',
      source: 'page',
      placeholder: 'Recipient first name',
      children: [{ text: '' }],
    },
    { text: ' B ' },
    {
      type: 'variable',
      id: 'authorFirstName',
      source: 'page',
      placeholder: 'Author first name',
      children: [{ text: '' }],
    },
    { text: ' C' },
  ],
};
const toolWithInputs = toolFactory.build({
  inputs: [
    {
      source: 'page',
      id: 'recipientFirstName',
      placeholder: 'Recipient first name',
    },
    {
      source: 'page',
      id: 'authorFirstName',
      placeholder: 'Author first name',
    },
  ],
  configuration: {
    data: {
      slate: true,
      rich: true,
      singleLine: false,
      children: [toolWithInputsSlateNode],
    },
  },
});

beforeEach(() => {
  isExtensionMock.mockReturnValue(true);
  clearMockMessageRouter();
  mockMessageRouter.addCommandHandler('contentScript', 'insertText', () =>
    Promise.resolve({ success: true, result: true })
  );
});

test('runs a tool with no inputs', async () => {
  const { getByText } = render(
    <Tool editType={null} tool={toolWithoutInputs} />
  );

  const toolElement = getByText(toolWithoutInputs.name);
  expect(toolElement).toBeInTheDocument();
  fireEvent.click(toolElement);
  await waitFor(() =>
    expectSentCommand(
      expect.objectContaining({
        destination: 'contentScript',
        command: 'insertText',
      })
    )
  );
});

test('runs a tool when page variables are present', async () => {
  const { getByText } = render(<Tool editType={null} tool={toolWithInputs} />, {
    pageVariables: { authorFirstName: 'John', recipientFirstName: 'Jane' },
  });

  const toolElement = getByText(toolWithInputs.name);
  expect(toolElement).toBeInTheDocument();
  fireEvent.click(toolElement);
  await waitFor(() =>
    expectSentCommand(
      expect.objectContaining({
        destination: 'contentScript',
        command: 'insertText',
      })
    )
  );
});

test('opens modal when missing page variable', async () => {
  const { getByText, findByText, findByPlaceholderText } = render(
    // Need app wrapper for modal
    <div id="app">
      <Tool editType={null} tool={toolWithInputs} />
    </div>,
    { pageVariables: { authorFirstName: 'John' } }
  );

  const toolElement = getByText(toolWithInputs.name);
  expect(toolElement).toBeInTheDocument();
  fireEvent.click(toolElement);

  expectNoSentCommands();

  const recipientInput = await findByPlaceholderText('Recipient first name');
  const authorInput = await findByPlaceholderText('Author first name');
  const runButton = await findByText('Run');

  expect(recipientInput.getAttribute('value')).toBe('');
  expect(authorInput.getAttribute('value')).toBe('John');

  fireEvent.change(recipientInput, { target: { value: 'Jane' } });
  fireEvent.click(runButton);

  await waitFor(() =>
    expectSentCommand(
      expect.objectContaining({
        destination: 'contentScript',
        command: 'insertText',
      })
    )
  );
});

describe('search analytics', () => {
  test('sends search analytics', async () => {
    const { findByText } = render(
      <MockSearchProvider searchInput={toolWithoutInputs.name}>
        <Tool editType={null} tool={toolWithoutInputs} searchIndex={3} />
      </MockSearchProvider>
    );

    const toolElement = await findByText(toolWithoutInputs.name);
    expect(toolElement).toBeInTheDocument();
    userEvent.click(toolElement);
    await waitFor(() => {
      expectSearchEvent({
        eventName: 'click',
        objectID: toolWithoutInputs.staticId,
        position: 4,
      });
    });
  });

  test('sends search analytics for 0 index items', async () => {
    const { findByText } = render(
      <MockSearchProvider searchInput={toolWithoutInputs.name}>
        <Tool editType={null} tool={toolWithoutInputs} searchIndex={0} />
      </MockSearchProvider>
    );

    const toolElement = await findByText(toolWithoutInputs.name);
    expect(toolElement).toBeInTheDocument();
    userEvent.click(toolElement);
    await waitFor(() => {
      expectSearchEvent({
        eventName: 'click',
        objectID: toolWithoutInputs.staticId,
        position: 1,
      });
    });
  });

  test('does not track without an index within search res', async () => {
    const { getByText } = render(
      <MockSearchProvider>
        <Tool editType={null} tool={toolWithoutInputs} />
      </MockSearchProvider>
    );

    const toolElement = getByText(toolWithoutInputs.name);
    expect(toolElement).toBeInTheDocument();
    fireEvent.click(toolElement);
    await waitFor(() => {
      expectNoSearchEvents();
    });
  });
});
