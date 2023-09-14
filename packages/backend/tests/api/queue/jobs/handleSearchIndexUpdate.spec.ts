import _, { identity, map, omit, sortBy, times } from 'lodash';
import { BranchTypeEnum } from 'prisma-client';

import { getDB } from '../../../../api/db';
import {
  handleCollectionReindex,
  handleReindexAll,
  handleToolReindex,
  handleWorkflowReindex,
} from '../../../../api/queue/jobs/handleSearchIndexUpdate';
import { handleWorkflowMutation } from '../../../../api/queue/jobs/handleVersionedNodeMutation';
import initSearchClient from '../../../../api/search/searchClient';
import { encodeId } from '../../../../api/utils';
import collectionFactory from '../../../helpers/factories/collection';
import toolFactory from '../../../helpers/factories/tool';
import workflowFactory from '../../../helpers/factories/workflow';

jest.mock('../../../../api/search/searchClient', () => {
  const mockReturn = {
    client: jest.fn(),
    index: { saveObjects: jest.fn(), deleteObjects: jest.fn() },
  };
  return {
    __esModule: true,
    default: (_: string) => mockReturn,
  };
});

const index = initSearchClient('IGNORED').index;
const saveObjects = index.saveObjects as jest.MockedFunction<
  typeof index.saveObjects
>;
const deleteObjects = index.deleteObjects as jest.MockedFunction<
  typeof index.deleteObjects
>;

beforeEach(async () => {
  jest.clearAllMocks();
  const db = getDB();
  await Promise.all([
    db.$executeRaw`DELETE FROM tools`,
    db.$executeRaw`DELETE FROM workflows`,
  ]);
  // Foreign key constraints require all tools and workflows are deleted before
  // deleting their collection
  await db.$executeRaw`DELETE FROM collections`;
});

function expectMockCall<TFunc extends (...args: any[]) => any>(
  mockFn: jest.MockedFunction<TFunc>,
  expectationFn: (params: Array<any>) => void
) {
  expect(mockFn).toHaveBeenCalledTimes(1);
  const callParams = mockFn.mock.calls[0];
  expectationFn(callParams[0]);
}

describe('tool indexing', () => {
  it.each(['GmailAction', 'OpenURLs', 'Automation', 'CustomThingTemplate'])(
    'indexes a %s tool',
    async (component) => {
      const tool = await toolFactory.create({ component });
      await handleToolReindex(tool.id);

      expectMockCall(saveObjects, (params) => {
        expect(params.length).toEqual(1);
        expect(params[0]).toEqual(
          expect.objectContaining({ objectID: tool.staticId })
        );
      });
    }
  );

  it('removes a deleted tool from the index', async () => {
    const tool = await toolFactory.create({
      isLatest: false,
    });
    await toolFactory.create({
      ...omit(tool, 'id'),
      isLatest: true,
      isArchived: true,
    });

    await handleToolReindex(tool.id);

    expectMockCall(deleteObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params).toEqual([tool.staticId]);
    });
  });

  it('always indexes the latest published tool', async () => {
    const tool = await toolFactory.create({
      isLatest: false,
    });
    const updatedTool = await toolFactory.create({
      ...omit(tool, 'id'),
      name: `${tool.name} but updated`,
      isLatest: true,
    });

    expect(saveObjects).not.toHaveBeenCalled();
    await handleToolReindex(tool.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params[0]).toEqual(
        expect.objectContaining({
          objectID: tool.staticId,
          name: updatedTool.name,
        })
      );
    });
  });

  describe('branch types that are not indexed', () => {
    test.each([
      BranchTypeEnum.draft,
      BranchTypeEnum.remix,
      BranchTypeEnum.suggestion,
    ])(
      'does not index tools with branch type %s',
      async (branchType: BranchTypeEnum) => {
        const tool = await toolFactory.create({
          branchType: BranchTypeEnum.published,
          isLatest: true,
        });

        const unpublishedTool = await toolFactory.create({
          ...omit(tool, 'id'),
          name: `${tool.name} is latest`,
          isLatest: true,
          branchType,
        });
        await handleToolReindex(unpublishedTool.id);

        expect(saveObjects).not.toHaveBeenCalled();
      }
    );
    test.each([
      BranchTypeEnum.draft,
      BranchTypeEnum.remix,
      BranchTypeEnum.suggestion,
    ])(
      'does not index workflows with branch type %s',
      async (branchType: BranchTypeEnum) => {
        const workflow = await workflowFactory.create({
          branchType: BranchTypeEnum.published,
          isLatest: true,
        });

        const unpublishedWorkflow = await workflowFactory.create({
          ...omit(workflow, 'id'),
          name: `${workflow.name} is latest`,
          isLatest: true,
          branchType,
        });
        await handleWorkflowReindex(unpublishedWorkflow.id);

        expect(saveObjects).not.toHaveBeenCalled();
      }
    );
  });
});

describe('workflow indexing', () => {
  it('indexes a workflow', async () => {
    const workflow = await workflowFactory.create();
    await handleWorkflowReindex(workflow.id);

    expect(saveObjects).toHaveBeenCalledTimes(1);
    const callParams = saveObjects.mock.calls[0];
    expect(callParams[0].length).toEqual(1);
    expect(callParams[0][0]).toEqual(
      expect.objectContaining({ objectID: workflow.staticId })
    );
    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params[0]).toEqual(
        expect.objectContaining({ objectID: workflow.staticId })
      );
    });
  });
  it('removes a deleted workflow from the index', async () => {
    const workflow = await workflowFactory.create({
      isLatest: false,
    });
    await workflowFactory.create({
      ...omit(workflow, 'id'),
      isLatest: true,
      isArchived: true,
    });

    await handleWorkflowReindex(workflow.id);

    expectMockCall(deleteObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params).toEqual([workflow.staticId]);
    });
  });
  it('always indexes the latest published workflow', async () => {
    const workflow = await workflowFactory.create({
      isLatest: false,
    });
    const updatedWorkflow = await workflowFactory.create({
      ...omit(workflow, 'id'),
      name: `${workflow.name} but updated`,
      isLatest: true,
    });

    expect(saveObjects).not.toHaveBeenCalled();
    await handleWorkflowReindex(workflow.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params[0]).toEqual(
        expect.objectContaining({
          objectID: workflow.staticId,
          name: updatedWorkflow.name,
        })
      );
    });
  });

  it('updates workflows where this workflow is embedded', async () => {
    const embeddedWorkflow = await workflowFactory.create();
    const parentWorkflow = await workflowFactory.create({
      collectionId: embeddedWorkflow.collectionId,
      contents: [
        {
          type: 'workflow-embed',
          workflow: embeddedWorkflow.staticId,
          children: [{ text: '' }],
        },
      ],
    });
    // This sets up the proper DB connections between workflows
    await handleWorkflowMutation(parentWorkflow.id, 'create');

    await handleWorkflowReindex(embeddedWorkflow.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(2);
      const createdObjects = params.map((object) => object.objectID);
      expect(createdObjects).toEqual(
        expect.arrayContaining([
          embeddedWorkflow.staticId,
          parentWorkflow.staticId,
        ])
      );
    });
  });

  it('does not update archived parents', async () => {
    const embeddedWorkflow = await workflowFactory.create();
    const parentWorkflow = await workflowFactory.create({
      isArchived: true,
      collectionId: embeddedWorkflow.collectionId,
      contents: [
        {
          type: 'workflow-embed',
          workflow: embeddedWorkflow.staticId,
          children: [{ text: '' }],
        },
      ],
    });
    // This sets up the proper DB connections between workflows
    await handleWorkflowMutation(parentWorkflow.id, 'create');

    await handleWorkflowReindex(embeddedWorkflow.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params[0]).toEqual(
        expect.objectContaining({
          objectID: embeddedWorkflow.staticId,
        })
      );
    });
  });

  it('updates workflows where the parent is embedded', async () => {
    const leafWorkflow = await workflowFactory.create();
    const vertexWorkflow = await workflowFactory.create({
      collectionId: leafWorkflow.collectionId,
      contents: [
        {
          type: 'workflow-embed',
          workflow: leafWorkflow.staticId,
          children: [{ text: '' }],
        },
      ],
    });
    const rootWorkflow = await workflowFactory.create({
      collectionId: leafWorkflow.collectionId,
      contents: [
        {
          type: 'workflow-embed',
          workflow: vertexWorkflow.staticId,
          children: [{ text: '' }],
        },
      ],
    });

    await handleWorkflowMutation(vertexWorkflow.id, 'create');
    await handleWorkflowMutation(rootWorkflow.id, 'create');

    await handleWorkflowReindex(leafWorkflow.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(3);
      const createdObjects = params.map((object) => object.objectID);
      expect(createdObjects).toEqual(
        expect.arrayContaining([
          leafWorkflow.staticId,
          vertexWorkflow.staticId,
          rootWorkflow.staticId,
        ])
      );
    });
  });

  it('protects against cycles', async () => {
    const leafWorkflow = await workflowFactory.create();
    const vertexWorkflow = await workflowFactory.create({
      collectionId: leafWorkflow.collectionId,
      contents: [
        {
          type: 'workflow-embed',
          workflow: leafWorkflow.staticId,
          children: [{ text: '' }],
        },
      ],
    });
    const rootWorkflow = await workflowFactory.create({
      collectionId: leafWorkflow.collectionId,
      contents: [
        {
          type: 'workflow-embed',
          workflow: vertexWorkflow.staticId,
          children: [{ text: '' }],
        },
      ],
    });

    await handleWorkflowMutation(vertexWorkflow.id, 'create');
    await handleWorkflowMutation(rootWorkflow.id, 'create');

    await getDB().workflow.update({
      where: { id: leafWorkflow.id },
      data: {
        contents: [
          {
            type: 'workflow-embed',
            workflow: rootWorkflow.staticId,
            children: [{ text: '' }],
          },
        ],
      },
    });

    await handleWorkflowMutation(leafWorkflow.id, 'create');

    await handleWorkflowReindex(leafWorkflow.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(3);
      const createdObjects = params.map((object) => object.objectID);
      expect(createdObjects).toEqual(
        expect.arrayContaining([
          leafWorkflow.staticId,
          vertexWorkflow.staticId,
          rootWorkflow.staticId,
        ])
      );
    });
  });
  it('does not reindex the parent when the workflow is linked', async () => {
    const linkedWorkflow = await workflowFactory.create();
    const parentWorkflow = await workflowFactory.create({
      collectionId: linkedWorkflow.collectionId,
      contents: [
        {
          type: 'workflow-link',
          workflow: linkedWorkflow.staticId,
          children: [{ text: '' }],
        },
      ],
    });
    // This sets up the proper DB connections between workflows
    await handleWorkflowMutation(parentWorkflow.id, 'create');

    await handleWorkflowReindex(linkedWorkflow.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(1);
      const createdObjects = params.map((object) => object.objectID);
      expect(createdObjects).toEqual(
        expect.arrayContaining([linkedWorkflow.staticId])
      );
    });
  });
});

describe('collection indexing', () => {
  it('indexes a collection', async () => {
    const collection = await collectionFactory.create();
    await handleCollectionReindex(collection.id);

    expectMockCall(saveObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params[0]).toEqual(
        expect.objectContaining({ objectID: encodeId('coll', collection.id) })
      );
    });
  });

  it('removes a deleted collection from the index', async () => {
    const collection = await collectionFactory.create();
    await getDB().collection.update({
      where: { id: collection.id },
      data: { isArchived: true },
    });

    await handleCollectionReindex(collection.id);

    expectMockCall(deleteObjects, (params) => {
      expect(params.length).toEqual(1);
      expect(params).toEqual([encodeId('coll', collection.id)]);
    });
  });
});

describe('reindex everything', () => {
  it('adds and deletes objects from the index', async () => {
    const collection = await collectionFactory.create();
    const tool = await toolFactory.create({ collectionId: collection.id });
    const workflow = await workflowFactory.create({
      collectionId: collection.id,
    });
    const deletedCollection = await collectionFactory.create({
      isArchived: true,
    });
    const deletedTool = await toolFactory.create({
      collectionId: collection.id,
      isArchived: true,
    });
    const deletedWorkflow = await workflowFactory.create({
      collectionId: collection.id,
      isArchived: true,
    });

    await handleReindexAll();

    // Not asserting on the exact calls to save objects, but we want to know
    // that all created objects eventually get indexed
    const createdObjects = map(saveObjects.mock.calls.flat(2), 'objectID');
    expect(createdObjects.length).toEqual(3);
    expect(createdObjects).toEqual(
      expect.arrayContaining([
        encodeId('coll', collection.id),
        tool.staticId,
        workflow.staticId,
      ])
    );
    // Same with delete, we just want to know all objects deleted
    const deletedObjects = deleteObjects.mock.calls.flat(2);
    expect(deletedObjects.length).toEqual(3);
    expect(deletedObjects).toEqual(
      expect.arrayContaining([
        encodeId('coll', deletedCollection.id),
        deletedWorkflow.staticId,
        deletedTool.staticId,
      ])
    );
  });

  it('paginates across a large number of items', async () => {
    const collections = await Promise.all(
      times(21, (_) => collectionFactory.create())
    );
    const collectionObjectIds = sortBy(
      collections.map((collection) => encodeId('coll', collection.id)),
      identity
    );

    // Shrink page size to 10
    await handleReindexAll(10);

    const createdObjects = sortBy(
      map(saveObjects.mock.calls.flat(2), 'objectID'),
      identity
    );
    expect(createdObjects).toEqual(collectionObjectIds);
  });
});
