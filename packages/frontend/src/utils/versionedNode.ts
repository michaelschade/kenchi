import { ApolloCache } from '@apollo/client';
import capitalize from 'lodash/capitalize';

import {
  BranchTypeEnum,
  ToolFragment,
  WorkflowFragment,
} from '../graphql/generated';

export function addToListCache(
  cache: ApolloCache<unknown>,
  obj: {
    __typename: 'WorkflowLatest' | 'ToolLatest';
    branchType: BranchTypeEnum;
    staticId: string;
    branchId: string | null;
    collection: { id: string };
  }
) {
  if (obj.branchType !== BranchTypeEnum.published) {
    return;
  }
  const fieldName = obj.__typename === 'WorkflowLatest' ? 'workflows' : 'tools';
  const targetStoreField = `${fieldName}:list${capitalize(fieldName)}`;
  cache.modify({
    id: cache.identify({ __typename: 'Collection', id: obj.collection.id }),
    fields: {
      [fieldName]: (value, { storeFieldName, toReference }) => {
        if (storeFieldName === targetStoreField) {
          return {
            ...value,
            edges: [
              ...value.edges,
              {
                __typename: `${obj.__typename}Edge`,
                node: toReference(
                  // We need to have a lastListFetch in here so the list can
                  // handle the new cache entry, but we want to to be in the
                  // past so we still re-fetch it from the server when we do our
                  // sync.
                  { lastListFetch: '2020-01-01', ...obj },
                  true
                ),
              },
            ],
          };
        } else {
          return value;
        }
      },
    },
  });
}

export function isWorkflow<
  TWL extends { __typename: 'WorkflowLatest' },
  TWR extends { __typename: 'WorkflowRevision' },
  TOther extends { __typename: string }
>(item: TWL | TWR | TOther): item is TWL | TWR {
  return (
    item.__typename === 'WorkflowLatest' ||
    item.__typename === 'WorkflowRevision'
  );
}

export function isTool<
  TTL extends { __typename: 'ToolLatest' },
  TTR extends { __typename: 'ToolRevision' },
  TOther extends { __typename: string }
>(item: TTL | TTR | TOther): item is TTL | TTR {
  return item.__typename === 'ToolLatest' || item.__typename === 'ToolRevision';
}

export function isSpace<
  TSL extends { __typename: 'SpaceLatest' },
  TSR extends { __typename: 'SpaceRevision' },
  TOther extends { __typename: string }
>(item: TSL | TSR | TOther): item is TSL | TSR {
  return (
    item.__typename === 'SpaceLatest' || item.__typename === 'SpaceRevision'
  );
}

export type VersionedNodeFragment = WorkflowFragment | ToolFragment;

export type VersionedNodeTypename =
  | 'WorkflowLatest'
  | 'WorkflowRevision'
  | 'ToolLatest'
  | 'ToolRevision'
  | 'SpaceLatest'
  | 'SpaceRevision';
