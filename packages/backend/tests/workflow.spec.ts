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
    contents: [],
    branchType: 'published',
    name: 'Test',
    keywords: [],
  };
}

const CREATE_WORKFLOW_MUTATION = `mutation($workflowData: WorkflowCreateInput!) {
  testMutation: createWorkflow(workflowData: $workflowData) {
    error {
      message
    }
    workflow {
      id
      staticId
    }
  }
}`;

const UPDATE_WORKFLOW_MUTATION = `mutation($id: ID!, $workflowData: WorkflowUpdateInput!) {
  testMutation: updateWorkflow(id: $id, workflowData: $workflowData) {
    error {
      message
    }
    workflow {
      id
      staticId
    }
  }
}`;

const MERGE_WORKFLOW_MUTATION = `mutation($fromId: ID!, $toId: ID, $workflowData: WorkflowUpdateInput!) {
  testMutation: mergeWorkflow(fromId: $fromId, toId: $toId, workflowData: $workflowData) {
    error {
      message
    }
    workflow {
      id
      staticId
    }
  }
}`;

const DELETE_WORKFLOW_MUTATION = `mutation($id: ID!) {
  testMutation: deleteWorkflow(id: $id) {
    error {
      message
    }
    workflow {
      id
      staticId
    }
  }
}`;

const createWorkflow = (extraData: Record<string, any> = {}) => ({
  gql: CREATE_WORKFLOW_MUTATION,
  variables: ({ collectionId }: Record<string, any>) => ({
    workflowData: { ...basicData(collectionId), ...extraData },
  }),
  reduce: reduceVersionSequence('id', 'workflowId'),
});

const testWorkflowSequence = (
  calls: TestCall[],
  expectedObjects: TestDBObject[]
) => {
  return testVersionSequence(
    ctx,
    ctx.app.db.workflow.findMany,
    'wrkf_',
    'workflow',
    calls,
    expectedObjects
  );
};

beforeEach(clearMockQueue);
it('create published workflow', () => {
  return testWorkflowSequence(
    [createWorkflow()],
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

it('update published workflow', () => {
  return testWorkflowSequence(
    [
      createWorkflow(),
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: { name: 'Test2' },
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
      (workflows) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test2',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: workflows[0].id,
        branchId: null,
      }),
    ]
  );
});

it('create, update, and publish draft', () => {
  return testWorkflowSequence(
    [
      createWorkflow({ branchType: 'draft' }),
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: { name: 'Test2' },
        }),
        reduce: reduceVersionSequence('id', 'workflowId'),
      },
      {
        gql: MERGE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          fromId: workflowId,
          workflowData: { name: 'Test3', branchType: 'published' },
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
        branchId: expect.stringContaining('wbrch_'),
      },
      (workflows) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'draft',
        branchedFromId: null,
        previousVersionId: workflows[0].id,
        branchId: workflows[0].branchId,
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
      (workflows) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'draft',
        branchedFromId: null,
        previousVersionId: workflows[1].id,
        branchId: workflows[1].branchId,
      }),
    ]
  );
});

it('create, suggest, and publish draft', () => {
  return testWorkflowSequence(
    [
      createWorkflow({ branchType: 'draft' }),
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: { name: 'Test2', branchType: 'suggestion' },
        }),
        reduce: reduceVersionSequence('id', 'suggestionId'),
      },
      {
        gql: MERGE_WORKFLOW_MUTATION,
        variables: ({ suggestionId }) => ({
          fromId: suggestionId,
          workflowData: { name: 'Test3', branchType: 'published' },
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
        branchId: expect.stringContaining('wbrch_'),
      },
      (workflows) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: null,
        previousVersionId: workflows[0].id,
        branchId: expect.stringContaining('wbrch_'),
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
      (workflows) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'suggestion',
        branchedFromId: null,
        previousVersionId: workflows[1].id,
        branchId: workflows[1].branchId,
      }),
    ]
  );
});

it('create and publish suggestion on top of existing workflow', () => {
  return testWorkflowSequence(
    [
      createWorkflow(),
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: { name: 'Test2', branchType: 'suggestion' },
        }),
        reduce: reduceVersionSequence('id', 'suggestionId'),
      },
      {
        gql: MERGE_WORKFLOW_MUTATION,
        variables: ({ suggestionId, workflowId }) => ({
          fromId: suggestionId,
          toId: workflowId,
          workflowData: { name: 'Test3' },
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
      (workflows) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: workflows[0].id,
        previousVersionId: workflows[0].id,
        branchId: expect.stringContaining('wbrch_'),
      }),
      // We publish before updating/archiving the suggestion
      (workflows) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test3',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: workflows[0].id,
        branchId: null,
      }),
      (workflows) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'suggestion',
        branchedFromId: workflows[0].id,
        previousVersionId: workflows[1].id,
        branchId: workflows[1].branchId,
      }),
    ]
  );
});

it('cannot create second suggestion', () => {
  return testWorkflowSequence(
    [
      createWorkflow(),
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: { name: 'Test2', branchType: 'suggestion' },
        }),
      },
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        errorMessage: expect.stringContaining(
          'You can only have one pending suggestion'
        ),
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: { name: 'Test3', branchType: 'suggestion' },
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
      (workflows) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: workflows[0].id,
        previousVersionId: workflows[0].id,
        branchId: expect.stringContaining('wbrch_'),
      }),
    ]
  );
});

it('delete published workflow', () => {
  return testWorkflowSequence(
    [
      createWorkflow(),
      {
        gql: DELETE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({ id: workflowId }),
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
      (workflows) => {
        expect(queue).toContainEqual({
          name: 'workflowMutation',
          workflowId: workflows[1].id,
          action: 'delete',
        });
        return {
          isLatest: true,
          isArchived: true,
          name: 'Test',
          branchType: 'published',
          branchedFromId: null,
          previousVersionId: workflows[0].id,
          branchId: null,
        };
      },
    ]
  );
});

it('preserves major changes in suggestions', () => {
  return testWorkflowSequence(
    [
      createWorkflow(),
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: {
            name: 'Test2',
            branchType: 'suggestion',
            majorChangeDescription: [{ text: 'major change' }],
          },
        }),
        reduce: reduceVersionSequence('id', 'suggestionId'),
      },
      {
        gql: MERGE_WORKFLOW_MUTATION,
        variables: ({ suggestionId, workflowId }) => ({
          fromId: suggestionId,
          toId: workflowId,
          workflowData: { name: 'Test3' },
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
      (workflows) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: workflows[0].id,
        previousVersionId: workflows[0].id,
        branchId: expect.stringContaining('wbrch_'),
        majorChangeDescription: [{ text: 'major change' }],
      }),
      // We publish before updating/archiving the suggestion
      (workflows) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test3',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: workflows[0].id,
        branchId: null,
        majorChangeDescription: [{ text: 'major change' }],
      }),
      (workflows) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'suggestion',
        branchedFromId: workflows[0].id,
        previousVersionId: workflows[1].id,
        branchId: workflows[1].branchId,
        majorChangeDescription: [{ text: 'major change' }],
      }),
    ]
  );
});

it('removes major changes when editing suggestion', () => {
  return testWorkflowSequence(
    [
      createWorkflow(),
      {
        gql: UPDATE_WORKFLOW_MUTATION,
        variables: ({ workflowId }) => ({
          id: workflowId,
          workflowData: {
            name: 'Test2',
            branchType: 'suggestion',
            majorChangeDescription: [{ text: 'major change' }],
          },
        }),
        reduce: reduceVersionSequence('id', 'suggestionId'),
      },
      {
        gql: MERGE_WORKFLOW_MUTATION,
        variables: ({ suggestionId, workflowId }) => ({
          fromId: suggestionId,
          toId: workflowId,
          workflowData: { name: 'Test3', majorChangeDescription: null },
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
      (workflows) => ({
        isLatest: false,
        isArchived: false,
        name: 'Test2',
        branchType: 'suggestion',
        branchedFromId: workflows[0].id,
        previousVersionId: workflows[0].id,
        branchId: expect.stringContaining('wbrch_'),
        majorChangeDescription: [{ text: 'major change' }],
      }),
      // We publish before updating/archiving the suggestion
      (workflows) => ({
        isLatest: true,
        isArchived: false,
        name: 'Test3',
        branchType: 'published',
        branchedFromId: null,
        previousVersionId: workflows[0].id,
        branchId: null,
        majorChangeDescription: null,
      }),
      (workflows) => ({
        isLatest: true,
        isArchived: true,
        name: 'Test3',
        branchType: 'suggestion',
        branchedFromId: workflows[0].id,
        previousVersionId: workflows[1].id,
        branchId: workflows[1].branchId,
        majorChangeDescription: null,
      }),
    ]
  );
});
