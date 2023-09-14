import { Hit } from '@algolia/client-search';

import { PartialCollection } from '../factories/collection';
import { PartialTool } from '../factories/tool';
import { PartialWorkflow } from '../factories/workflow';

type ResultShape = {
  name: string;
  description?: string;
  content?: string;
  type: 'collection' | 'playbook' | 'snippet';
};

type Obj = PartialCollection | PartialTool | PartialWorkflow;

const hitFor = (object: Obj): Hit<ResultShape> => {
  const objectID = object.id;
  const name = object.name;
  let type: 'collection' | 'playbook' | 'snippet' | undefined = undefined;
  let description = undefined;
  switch (object.__typename) {
    case 'Collection':
      description = object.description;
      type = 'collection';
      break;
    case 'ToolLatest':
      type = 'snippet';
      break;
    case 'WorkflowLatest':
      description = object.description;
      type = 'playbook';
      break;
  }
  return { objectID, name, type, description };
};

export const hitsFor = (results: Array<Obj>): Hit<ResultShape>[] =>
  results.map((result) => hitFor(result));
