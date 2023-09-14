import {
  BranchTypeEnum,
  Collection,
  Prisma,
  Tool,
  Workflow,
} from 'prisma-client';
import { Node, Text } from 'slate';

import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { getDB } from '../db';
import { expectSlateNodeArray, expectToolConfig } from '../models/utils';
import { encodeId } from '../utils';

type CommonSearchAttributes = {
  objectID: string;
  name: string;
  collection: { id: string };
};

type VersionedNodeMetadata = {
  metadata: { id: number; createdAtDate: Date; createdAtTimestamp: number };
};
type ToolSearchObject = CommonSearchAttributes &
  VersionedNodeMetadata & {
    type: 'snippet';
    keywords: string[];
    contents?: string;
  };

type WorkflowSearchObject = CommonSearchAttributes &
  VersionedNodeMetadata & {
    type: 'playbook';
    keywords: string[];
    description: string;
    contents: string;
  };

type CollectionSearchObject = CommonSearchAttributes & {
  type: 'collection';
  description: string;
  metadata: { id: number; updatedAtDate: Date; updatedAtTimestamp: number };
};

export async function toolToSearchObject(
  tool: Tool
): Promise<Readonly<ToolSearchObject>> {
  const {
    name,
    keywords,
    configuration,
    collectionId,
    staticId: objectID,
    id,
    createdAt,
    component,
  } = tool;
  const contents = await serializeToolContents(component, configuration);

  return {
    objectID,
    type: 'snippet',
    name,
    keywords,
    contents,
    collection: { id: encodeId('coll', collectionId) },
    metadata: {
      id,
      createdAtDate: createdAt,
      createdAtTimestamp: Math.floor(createdAt.getTime() / 1000),
    },
  };
}

export async function workflowToSearchObject(
  workflow: Workflow
): Promise<Readonly<WorkflowSearchObject>> {
  const {
    name,
    description,
    keywords,
    contents,
    collectionId,
    staticId: objectID,
    id,
    createdAt,
  } = workflow;
  expectSlateNodeArray(contents);
  return {
    objectID,
    type: 'playbook',
    name,
    description,
    keywords,
    contents: await serializeContentText(contents, new Set([objectID])),
    collection: { id: encodeId('coll', collectionId) },
    metadata: {
      id,
      createdAtDate: createdAt,
      createdAtTimestamp: Math.floor(createdAt.getTime() / 1000),
    },
  };
}

export async function collectionToSearchObject(
  collection: Collection
): Promise<Readonly<CollectionSearchObject>> {
  const { name, description, id, updatedAt } = collection;
  const staticId = encodeId('coll', id);
  return {
    objectID: staticId,
    type: 'collection',
    name,
    description,
    // While this may look redundant given the ObjectID, adding collection.id
    // makes the collection confirm to the way we restrict visibility of search
    // results by generating search-keys with filter restrictions in the form of
    // 'collection.id:<coll-static-id>'
    collection: { id: staticId },
    metadata: {
      id,
      updatedAtDate: updatedAt,
      updatedAtTimestamp: Math.floor(updatedAt.getTime() / 1000),
    },
  };
}

const whitespaceRegexp = /\s+/g;
async function serializeContentText(
  nodes: SlateNode[],
  visitedWorkflows: Set<string>
): Promise<string> {
  return (
    await Promise.all(
      nodes.map(async (root) => {
        let contents = '';
        for (const [node, _path] of Node.nodes(root)) {
          contents += (await serializeNodeText(node, visitedWorkflows)) + ' ';
        }

        return contents;
      })
    )
  )
    .join(' ')
    .trim()
    .replaceAll(whitespaceRegexp, ' ');
}

async function serializeNodeText(
  node: SlateNode,
  visitedPlaybooks: Set<string>
): Promise<string> {
  let contents: string | undefined = undefined;

  if (Text.isText(node)) {
    contents = node.text;
  } else if ('type' in node && node.type === 'workflow-embed') {
    const staticId = node.workflow;
    if (!visitedPlaybooks.has(staticId)) {
      const workflow = await getDB().workflow.findFirst({
        where: {
          staticId: staticId,
          branchType: BranchTypeEnum.published,
          isLatest: true,
        },
      });
      if (workflow) {
        visitedPlaybooks.add(staticId);
        contents = await serializeContentText(
          workflow?.contents as unknown as SlateNode[],
          visitedPlaybooks
        );
      }
    }
  }
  return contents || '';
}
async function serializeToolContents(
  component: string,
  configuration: Prisma.JsonValue
) {
  if (component !== 'GmailAction') {
    return;
  }
  expectToolConfig(configuration);
  return serializeContentText(configuration.data.children, new Set());
}
