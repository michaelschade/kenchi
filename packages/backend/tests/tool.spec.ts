import {
  createTestContext,
  reduceVersionSequence,
  TestCall,
  TestDBObject,
  testVersionSequence,
} from './__helpers';
import { clearMockQueue, mockQueue as queue } from './__mocks__/bull';

const ctx = createTestContext();

function basicData(collectionId: string) {
  return {
    description: 'Description',
    collectionId,
    component: 'GmailAction',
    inputs: [],
    configuration: {},
    branchType: 'published',
    name: 'Test',
    keywords: [],
  };
}

const CREATE_TOOL_MUTATION = `mutation($toolData: ToolCreateInput!) {
  testMutation: createTool(toolData: $toolData) {
    error {
      message
    }
    tool {
      id
      staticId
    }
  }
}`;

const UPDATE_TOOL_MUTATION = `mutation($id: ID!, $toolData: ToolUpdateInput!) {
  testMutation: updateTool(id: $id, toolData: $toolData) {
    error {
      message
    }
    tool {
      id
      staticId
    }
  }
}`;

const MERGE_TOOL_MUTATION = `mutation($fromId: ID!, $toId: ID, $toolData: ToolUpdateInput!) {
  testMutation: mergeTool(fromId: $fromId, toId: $toId, toolData: $toolData) {
    error {
      message
    }
    tool {
      id
      staticId
    }
  }
}`;

const DELETE_TOOL_MUTATION = `mutation($id: ID!) {
  testMutation: deleteTool(id: $id) {
    error {
      message
    }
    tool {
      id
      staticId
    }
  }
}`;

const createTool = (extraData: Record<string, any> = {}) => ({
  gql: CREATE_TOOL_MUTATION,
  variables: ({ collectionId }: Record<string, any>) => ({
    toolData: { ...basicData(collectionId), ...extraData },
  }),
  reduce: reduceVersionSequence('id', 'toolId'),
});

const testToolSequence = (
  calls: TestCall[],
  expectedObjects: TestDBObject[]
) => {
  return testVersionSequence(
    ctx,
    ctx.app.db.tool.findMany,
    'tool_',
    'tool',
    calls,
    expectedObjects
  );
};

beforeEach(clearMockQueue);
it('create published tool', async () => {
  return testToolSequence(
    [createTool()],
    [
      {
        isLatest: true,
        isArchived: false,
        name: 'Test',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: null,
        branchId: null,
      },
    ]
  );
});

it('update published tool', async () => {
  return testToolSequence(
    [
      createTool(),
      {
        gql: UPDATE_TOOL_MUTATION,
        variables: ({ toolId }) => ({
          id: toolId,
          toolData: { name: 'Test2' },
        }),
      },
    ],
    [
      {
        isLatest: false,
        isArchived: false,
        name: 'Test',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: null,
        branchId: null,
      },
      (tools) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test2',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: tools[0].id,
        branchId: null,
      }),
    ]
  );
});

it('create, update, and publish draft', () => {
  return testToolSequence(
    [
      createTool({ branchType: 'draft' }),
      {
        gql: UPDATE_TOOL_MUTATION,
        variables: ({ toolId }) => ({
          id: toolId,
          toolData: { name: 'Test2' },
        }),
        reduce: reduceVersionSequence('id', 'toolId'),
      },
      {
        gql: MERGE_TOOL_MUTATION,
        variables: ({ toolId }) => ({
          fromId: toolId,
          toolData: { name: 'Test3', branchType: 'published' },
        }),
      },
    ],
    [
      {
        isLatest: false,
        isArchived: false,
        name: 'Test',
        branchType: 'draft',
        branchedFromId: null,
        previousVersionId: null,
        branchId: expect.stringContaining('tbrch_'),
      },
      (tools) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'draft',
        branchedFromId: null,
        previousVersionId: tools[0].id,
        branchId: tools[0].branchId,
      }),
      // We publish before updating/archiving the draft
      {
        isLatest: true,
        isArchived: false,
        name: 'Test3',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: null,
        branchId: null,
      },
      (tools) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'draft',
        branchedFromId: null,
        previousVersionId: tools[1].id,
        branchId: tools[1].branchId,
      }),
    ]
  );
});

it('create, suggest, and publish draft', () => {
  return testToolSequence(
    [
      createTool({ branchType: 'draft' }),
      {
        gql: UPDATE_TOOL_MUTATION,
        variables: ({ toolId }) => ({
          id: toolId,
          toolData: { name: 'Test2', branchType: 'suggestion' },
        }),
        reduce: reduceVersionSequence('id', 'suggestionId'),
      },
      {
        gql: MERGE_TOOL_MUTATION,
        variables: ({ suggestionId }) => ({
          fromId: suggestionId,
          toolData: { name: 'Test3', branchType: 'published' },
        }),
      },
    ],
    [
      {
        isLatest: false,
        isArchived: false,
        name: 'Test',
        branchType: 'draft',
        branchedFromId: null,
        previousVersionId: null,
        branchId: expect.stringContaining('tbrch_'),
      },
      (tools) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: null,
        previousVersionId: tools[0].id,
        branchId: expect.stringContaining('tbrch_'),
      }),
      // We publish before updating/archiving the suggestion
      {
        isLatest: true,
        isArchived: false,
        name: 'Test3',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: null,
        branchId: null,
      },
      (tools) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'suggestion',
        branchedFromId: null,
        previousVersionId: tools[1].id,
        branchId: tools[1].branchId,
      }),
    ]
  );
});

it('create and publish suggestion on top of existing tool', () => {
  return testToolSequence(
    [
      createTool(),
      {
        gql: UPDATE_TOOL_MUTATION,
        variables: ({ toolId }) => ({
          id: toolId,
          toolData: { name: 'Test2', branchType: 'suggestion' },
        }),
        reduce: reduceVersionSequence('id', 'suggestionId'),
      },
      {
        gql: MERGE_TOOL_MUTATION,
        variables: ({ suggestionId, toolId }) => ({
          fromId: suggestionId,
          toId: toolId,
          toolData: { name: 'Test3' },
        }),
      },
    ],
    [
      {
        isLatest: false,
        isArchived: false,
        name: 'Test',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: null,
        branchId: null,
      },
      (tools) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: tools[0].id,
        previousVersionId: tools[0].id,
        branchId: expect.stringContaining('tbrch_'),
      }),
      // We publish before updating/archiving the suggestion
      (tools) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test3',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: tools[0].id,
        branchId: null,
      }),
      (tools) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'suggestion',
        branchedFromId: tools[0].id,
        previousVersionId: tools[1].id,
        branchId: tools[1].branchId,
      }),
    ]
  );
});

it('cannot create second suggestion', () => {
  return testToolSequence(
    [
      createTool(),
      {
        gql: UPDATE_TOOL_MUTATION,
        variables: ({ toolId }) => ({
          id: toolId,
          toolData: { name: 'Test2', branchType: 'suggestion' },
        }),
      },
      {
        gql: UPDATE_TOOL_MUTATION,
        errorMessage: expect.stringContaining(
          'You can only have one pending suggestion'
        ),
        variables: ({ toolId }) => ({
          id: toolId,
          toolData: { name: 'Test3', branchType: 'suggestion' },
        }),
      },
    ],
    [
      {
        isLatest: true,
        isArchived: false,
        name: 'Test',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: null,
        branchId: null,
      },
      (tools) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: tools[0].id,
        previousVersionId: tools[0].id,
        branchId: expect.stringContaining('tbrch_'),
      }),
    ]
  );
});

it('delete published tool', async () => {
  return testToolSequence(
    [
      createTool(),
      {
        gql: DELETE_TOOL_MUTATION,
        variables: ({ toolId }) => ({ id: toolId }),
      },
    ],
    [
      {
        isLatest: false,
        isArchived: false,
        name: 'Test',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: null,
        branchId: null,
      },
      (tools) => {
        expect(queue).toContainEqual({
          name: 'toolMutation',
          toolId: tools[1].id,
          action: 'delete',
        });
        return {
          isLatest: true,
          isArchived: true,
          name: 'Test',
          branchType: 'published',
          branchedFromId: null,
          previousVersionId: tools[0].id,
          branchId: null,
        };
      },
    ]
  );
});
