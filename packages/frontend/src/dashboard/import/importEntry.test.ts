import { waitFor } from '@testing-library/react';

import { success } from '@kenchi/shared/lib/Result';

import { getClient } from '../../graphql/client';
import { ImportEntry } from '../../importers';
import toolFactory from '../../test/factories/tool';
import { mockApolloClient } from '../../testUtils';
import { importEntry } from './importEntry';

jest.mock('../../graphql/client');

const mockGetClient = jest.mocked(getClient);
const tool = toolFactory.build();
const mutationMock = jest.fn();
const mockClient = mockApolloClient({
  mocks: {
    SlateNodeArray: () => [],
  },
  resolvers: {
    Mutation: {
      createTool: (_, args) => mutationMock(args),
    },
  },
});

beforeEach(() => {
  mockGetClient.mockImplementation(() => mockClient);
  mutationMock.mockReturnValue({ tool, error: null });
});

it('creates a GmailAction tool', async () => {
  const entry: ImportEntry = {
    id: '1',
    name: 'An Entry',
    slate: success([
      { type: 'paragraph', children: [{ text: 'Some content to insert' }] },
    ]),
  };
  importEntry(entry, 'col_123', false);
  await waitFor(() => {
    expect(mutationMock).toBeCalledWith(
      expect.objectContaining({
        toolData: expect.objectContaining({
          configuration: {
            data: {
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: 'Some content to insert' }],
                },
              ],
              slate: true,
              singleLine: false,
              rich: true,
            },
          },
        }),
      })
    );
  });
});

it('creates Zendesk actions', async () => {
  const tagsConfig = {
    tagsToAdd: ['tag1', 'tag2'],
    tagsToRemove: ['tag3'],
    tagsToSet: ['tag4'],
  };
  const entry: ImportEntry = {
    id: '1',
    name: 'An Entry',
    slate: success([{ type: 'paragraph', children: [{ text: '' }] }]),
    zendeskTags: success(tagsConfig),
    zendeskAssign: success({ userId: 'self' }),
    zendeskSetTicketStatus: success('solved'),
  };
  importEntry(entry, 'col_123', false);
  await waitFor(() => {
    expect(mutationMock).toBeCalledWith(
      expect.objectContaining({
        toolData: expect.objectContaining({
          configuration: expect.objectContaining({
            // No slate content is modeled as an empty paragraph
            data: expect.objectContaining({
              children: [{ type: 'paragraph', children: [{ text: '' }] }],
            }),
            zendeskTags: tagsConfig,
            zendeskAssign: { userId: 'self' },
            zendeskSetTicketStatus: 'solved',
          }),
        }),
      })
    );
  });
});
