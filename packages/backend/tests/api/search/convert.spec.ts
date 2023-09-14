import { getDB } from '../../../api/db';
import {
  collectionToSearchObject,
  toolToSearchObject,
  workflowToSearchObject,
} from '../../../api/search/convert';
import { encodeId } from '../../../api/utils';
import collectionFactory from '../../helpers/factories/collection';
import toolFactory from '../../helpers/factories/tool';
import workflowFactory from '../../helpers/factories/workflow';

function collectionStaticId(id: number): string {
  return encodeId('coll', id);
}
it('converts a tool into searchable fields', async () => {
  const tool = await toolFactory.create();

  expect(await toolToSearchObject(tool)).toMatchObject({
    objectID: tool.staticId,
    type: 'snippet',
    name: tool.name,
    keywords: tool.keywords,
    collection: { id: collectionStaticId(tool.collectionId) },
    metadata: {
      id: tool.id,
      createdAtDate: tool.createdAt,
      createdAtTimestamp: Math.floor(tool.createdAt.getTime() / 1000),
    },
  });
});

it('converts a workflow into searchable fields', async () => {
  const workflow = await workflowFactory.create();
  expect(await workflowToSearchObject(workflow)).toMatchObject({
    objectID: workflow.staticId,
    type: 'playbook',
    name: workflow.name,
    description: workflow.description,
    keywords: workflow.keywords,
    collection: { id: collectionStaticId(workflow.collectionId) },
    metadata: {
      id: workflow.id,
      createdAtDate: workflow.createdAt,
      createdAtTimestamp: Math.floor(workflow.createdAt.getTime() / 1000),
    },
  });
});

it('converts a collection into searchable fields', async () => {
  const collection = await collectionFactory.create();
  expect(await collectionToSearchObject(collection)).toMatchObject({
    objectID: collectionStaticId(collection.id),
    type: 'collection',
    name: collection.name,
    description: collection.description,
    collection: { id: collectionStaticId(collection.id) },
    metadata: {
      id: collection.id,
      updatedAtDate: collection.updatedAt,
      updatedAtTimestamp: Math.floor(collection.updatedAt.getTime() / 1000),
    },
  });
});

describe('text content', () => {
  it('extracts the text content from a GmailAction tool', async () => {
    const tool = await toolFactory.create({
      component: 'GmailAction',
      configuration: {
        data: {
          slate: true,
          singleLine: false,
          rich: true,
          children: [{ children: [{ text: `test` }] }],
        },
      },
    });

    expect((await toolToSearchObject(tool)).contents).toEqual('test');
  });

  it.each([
    {
      component: 'OpenURLs',
      configuration: {
        urls: [
          {
            children: [{ text: 'http://example.com' }],
            rich: false,
            singleLine: true,
            slate: true,
          },
        ],
      },
    },
    {
      component: 'Automation',
      configuration: {
        steps: [
          {
            command: 'click',
            id: 'step_001',
            label: 'Step 1',
            xpath: '//div[starts-with(@id, "kittens_")]//a',
          },
          {
            command: 'waitFor',
            id: 'step_002',
            label: 'Step 2',
            timeout: 30000,
            xpath: '//div[has-class("napping")]]',
          },
        ],
      },
    },
    {
      component: 'CustomThingTemplate',
      configuration: { tool: 'RecentLogins' },
    },
  ])(
    'does not index content for a $component tool',
    async ({ component, configuration }) => {
      const tool = await toolFactory.create({
        component,
        configuration,
      });

      expect((await toolToSearchObject(tool)).contents).toBeUndefined();
    }
  );

  it('extracts the text content from a workflow', async () => {
    const workflow = await workflowFactory.create({
      contents: [{ type: 'paragraph', children: [{ text: 'test' }] }],
    });

    expect((await workflowToSearchObject(workflow)).contents).toEqual('test');
  });

  it('strips formatting', async () => {
    const workflow = await workflowFactory.create({
      contents: [
        {
          type: 'paragraph',
          children: [
            { text: 'More ' },
            { text: 'complex', bold: true },
            { text: ' text.' },
          ],
        },
        { type: 'paragraph', children: [{ text: 'With paragraphs.' }] },
        { type: 'paragraph', children: [{ text: '' }] },
        {
          type: 'bulleted-list',
          children: [
            {
              type: 'list-item',
              children: [{ type: 'paragraph', children: [{ text: 'and' }] }],
            },
            {
              type: 'list-item',
              children: [{ type: 'paragraph', children: [{ text: 'lists' }] }],
            },
            {
              type: 'list-item',
              children: [{ type: 'paragraph', children: [{ text: 'as' }] }],
            },
            {
              type: 'list-item',
              children: [{ type: 'paragraph', children: [{ text: 'well' }] }],
            },
          ],
        },
      ],
    });

    expect((await workflowToSearchObject(workflow)).contents).toEqual(
      'More complex text. With paragraphs. and lists as well'
    );
  });

  it('extracts the contents of embedded workflows', async () => {
    const embeddedWorkflow = await workflowFactory.create({
      contents: [
        { type: 'paragraph', children: [{ text: 'Embedded content.' }] },
      ],
    });
    const workflow = await workflowFactory.create({
      collectionId: embeddedWorkflow.collectionId,
      contents: [
        { type: 'paragraph', children: [{ text: 'Before embed.' }] },
        {
          type: 'void-wrapper',
          children: [
            { type: 'void-spacer', children: [{ text: '' }] },
            {
              type: 'workflow-embed',
              workflow: embeddedWorkflow.staticId,
              children: [{ text: '' }],
            },
            { type: 'void-spacer', children: [{ text: '' }] },
          ],
        },
        { type: 'paragraph', children: [{ text: 'After embed.' }] },
        { type: 'paragraph', children: [{ text: '' }] },
      ],
    });

    expect((await workflowToSearchObject(workflow)).contents).toEqual(
      'Before embed. Embedded content. After embed.'
    );
  });

  it('guards against embedded workflows with cycles', async () => {
    const vertexWorkflow = await workflowFactory.create({
      contents: [],
    });
    const rootWorkflow = await workflowFactory.create({
      collectionId: vertexWorkflow.collectionId,
      contents: [
        { type: 'paragraph', children: [{ text: 'Before embed.' }] },
        {
          type: 'void-wrapper',
          children: [
            { type: 'void-spacer', children: [{ text: '' }] },
            {
              type: 'workflow-embed',
              workflow: vertexWorkflow.staticId,
              children: [{ text: '' }],
            },
            { type: 'void-spacer', children: [{ text: '' }] },
          ],
        },
        { type: 'paragraph', children: [{ text: 'After embed.' }] },
        { type: 'paragraph', children: [{ text: '' }] },
      ],
    });

    const leafWorkflow = await workflowFactory.create({
      collectionId: vertexWorkflow.collectionId,
      contents: [
        { type: 'paragraph', children: [{ text: 'Before cycle.' }] },
        {
          type: 'void-wrapper',
          children: [
            { type: 'void-spacer', children: [{ text: '' }] },
            {
              type: 'workflow-embed',
              workflow: rootWorkflow.staticId,
              children: [{ text: '' }],
            },
            { type: 'void-spacer', children: [{ text: '' }] },
          ],
        },
        { type: 'paragraph', children: [{ text: 'After cycle.' }] },
      ],
    });

    await getDB().workflow.update({
      where: { id: vertexWorkflow.id },
      data: {
        contents: [
          { type: 'paragraph', children: [{ text: 'Before leaf.' }] },
          {
            type: 'void-wrapper',
            children: [
              { type: 'void-spacer', children: [{ text: '' }] },
              {
                type: 'workflow-embed',
                workflow: leafWorkflow.staticId,
                children: [{ text: '' }],
              },
              { type: 'void-spacer', children: [{ text: '' }] },
            ],
          },
          { type: 'paragraph', children: [{ text: 'After leaf.' }] },
        ],
      },
    });

    expect((await workflowToSearchObject(rootWorkflow)).contents).toEqual(
      'Before embed. Before leaf. Before cycle. After cycle. After leaf. After embed.'
    );
  });
});
