import {
  FieldFunctionOptions,
  InMemoryCache,
  NormalizedCacheObject,
  Reference,
  StoreObject,
} from '@apollo/client/core';
import { addBreadcrumb, captureMessage } from '@sentry/react';
import { CachePersistor } from 'apollo3-cache-persist';
import {
  ApolloPersistOptions,
  PersistedData,
  PersistentStorage,
} from 'apollo3-cache-persist/types';
import debounce from 'lodash/debounce';

import { isDevelopment } from '../utils';
import { trackSpan, trackTelemetry } from '../utils/analytics';
import getLocalForage from '../utils/localForage';

const jsonDecode = (val: any) =>
  typeof val === 'string' ? JSON.parse(val) : val;

const versionedNodeFields = {
  majorChangeDescription: { read: jsonDecode },
};
const workflowFields = {
  contents: { read: jsonDecode },
  ...versionedNodeFields,
};
const toolFields = {
  inputs: { read: jsonDecode },
  configuration: { read: jsonDecode },
  ...versionedNodeFields,
};

const isListPrefixedConnectionDirective = (
  field: FieldFunctionOptions['field']
) => {
  const connectionDirective = field?.directives?.find(
    (d) => d.name.value === 'connection'
  );
  if (!connectionDirective) {
    return false;
  }
  const directiveName = connectionDirective.arguments?.find(
    (a) => a.name.value === 'key'
  )?.value;
  if (
    directiveName?.kind !== 'StringValue' ||
    !directiveName.value.startsWith('list')
  ) {
    return false;
  }
  return true;
};

type EdgesType = {
  edges: { node: StoreObject | Reference }[];
};

type EdgesWithRemovedType = EdgesType & {
  removed: string[];
};

const mergeAndDedupe = (
  existing: EdgesWithRemovedType | undefined,
  incoming: EdgesWithRemovedType,
  { field, readField }: FieldFunctionOptions
): EdgesWithRemovedType => {
  if (!isListPrefixedConnectionDirective(field)) {
    return incoming;
  }

  const oldEdges = existing?.edges || [];
  const newEdges = incoming.edges;

  // Static IDs that were moved to different collections need to be removed
  const staticIds = new Set(incoming.removed || []);
  newEdges.forEach((e) =>
    staticIds.add(readField<string>('staticId', e.node)!)
  );
  const rtnEdges: any[] = [];
  oldEdges.forEach((e) => {
    const staticId = readField<string>('staticId', e.node)!;
    if (!staticIds.has(staticId)) {
      rtnEdges.push(e);
    }
    // In case we accidentally get the same staticId added in twice, at least dedupe it
    // TODO: maybe log if this happens, it should never happen
    staticIds.add(staticId);
  });

  newEdges.forEach((e) => {
    if (!readField<string>('isArchived', e.node)!) {
      rtnEdges.push(e);
    }
  });

  return {
    edges: rtnEdges,
    removed: [],
  };
};

// Only exported for testing
export const createNewCache = () =>
  new InMemoryCache({
    possibleTypes: {
      // TODO: generate this from our schema?
      VersionedNode: [
        'WorkflowRevision',
        'WorkflowLatest',
        'ToolRevision',
        'ToolLatest',
        'SpaceRevision',
        'SpaceLatest',
      ],
      Workflow: ['WorkflowRevision', 'WorkflowLatest'],
      Tool: ['ToolRevision', 'ToolLatest'],
      Space: ['SpaceRevision', 'SpaceLatest'],
    },
    typePolicies: {
      Viewer: {
        keyFields: [],
      },
      Domain: {
        fields: {
          variableExtractors: { read: jsonDecode },
        },
      },
      UserItemSettings: {
        keyFields: ['staticId'],
      },
      Collection: {
        fields: {
          acl: { merge: false }, // Default behavior, this just removes the warning
          tools: { merge: mergeAndDedupe },
          workflows: { merge: mergeAndDedupe },
        },
      },
      ProductChange: {
        fields: {
          description: { read: jsonDecode },
        },
      },
      User: {
        fields: {
          topUsedToolStaticIds: {
            merge: false,
          },
          topViewedWorkflowStaticIds: {
            merge: false,
          },
          groups: {
            merge: false,
          },
          organizationPermissions: {
            merge: false,
          },
        },
      },
      SpaceRevision: {
        fields: versionedNodeFields,
      },
      SpaceLatest: {
        keyFields: ['staticId', 'branchId'],
        fields: versionedNodeFields,
      },
      WorkflowRevision: {
        fields: workflowFields,
      },
      WorkflowLatest: {
        keyFields: ['staticId', 'branchId'],
        fields: workflowFields,
      },
      ToolRevision: {
        fields: toolFields,
      },
      ToolLatest: {
        keyFields: ['staticId', 'branchId'],
        fields: toolFields,
      },
    },
  });

const cacheSingleton = createNewCache();

if (isDevelopment()) {
  // Convenienve to provide console debugging for Apollo's cache
  // window.kenchCache.data.data gives raw cache access.
  // @ts-ignore
  window.kenchiCache = cacheSingleton;
}
let persistorSingleton: CachePersistor<NormalizedCacheObject> | null = null;

const PERSIST_KEY = 'apollo-cache-persist';

let ourLastPersist: null | number = null;
const onCacheWrite = (persist: () => void) => {
  const localForage = getLocalForage();
  const write = cacheSingleton.write;
  const evict = cacheSingleton.evict;
  const modify = cacheSingleton.modify;
  const wrappedPersist = debounce(
    async () => {
      persist();

      const lastPersist = await localForage.getItem('lastPersist');
      let tabOverwrite = false;
      if (ourLastPersist && lastPersist && typeof lastPersist === 'number') {
        tabOverwrite = lastPersist !== ourLastPersist;
        if (tabOverwrite) {
          addBreadcrumb({
            message: 'Another tab overwrite',
            data: {
              lastPersist,
              ourLastPersist,
              logs: persistorSingleton?.getLogs()?.map((l) => l[1]),
              search: window.location.search,
            },
          });
        }
      }
      ourLastPersist = new Date().getTime();

      trackTelemetry(
        'persistor_persist',
        await telemetryData({ tab_overwrite: tabOverwrite })
      );

      await localForage.setItem('lastPersist', ourLastPersist);
    },
    500,
    { maxWait: 2000 }
  );

  cacheSingleton.write = (...args: any) => {
    const result = write.apply(cacheSingleton, args);
    wrappedPersist();
    return result;
  };
  cacheSingleton.evict = (...args: any) => {
    const result = evict.apply(cacheSingleton, args);
    wrappedPersist();
    return result;
  };
  cacheSingleton.modify = (...args: any) => {
    const result = modify.apply(cacheSingleton, args);
    wrappedPersist();
    return result;
  };

  return () => {
    cacheSingleton.write = write;
    cacheSingleton.evict = evict;
    cacheSingleton.modify = modify;
  };
};

async function telemetryData(extra?: Record<string, unknown>) {
  return {
    ...extra,
    service_name: 'cache',
    persistor_size: await persistorSingleton?.getSize(),
    cache_key_count: Object.keys(cacheSingleton.extract()).length,
  };
}

async function pauseSync() {
  trackTelemetry('persistor_pause', await telemetryData());
  persistorSingleton?.pause();
}

async function resumeSync() {
  trackTelemetry('persistor_resume', await telemetryData());
  persistorSingleton?.resume();
}

class FilteringStorage implements PersistentStorage<NormalizedCacheObject> {
  constructor(private storage: LocalForage) {
    this.storage = storage;
  }

  async getItem(key: string): Promise<NormalizedCacheObject | null> {
    const item = await this.storage.getItem(key);
    if (typeof item === 'string') {
      return JSON.parse(item);
    } else {
      return null;
    }
  }

  removeItem(key: string): Promise<void> {
    return this.storage.removeItem(key);
  }

  async setItem(
    key: string,
    value: PersistedData<NormalizedCacheObject>
  ): Promise<void> {
    let valueToPersist: string | null;
    if (typeof value === 'string') {
      // Should never happen, probably just a typescript weirdness in apollo-cache-persist
      captureMessage('Trying to persist a string');
      valueToPersist = value;
    } else if (!value) {
      // Also weird but peaceful I suppose...
      valueToPersist = value;
    } else {
      const filteredValue: NormalizedCacheObject = { ...value };
      // We don't want to save ROOT_MUTATION, as it can get large, prevent GCs,
      // and contain secrets (like login tokens). See
      // https://github.com/apollographql/apollo-client/issues/5950#issuecomment-663572232
      // We want to use the original evict to not trigger an infinite loop of
      // cache writes.
      delete filteredValue.ROOT_MUTATION;

      if (filteredValue.ROOT_QUERY) {
        const rootQuery = { ...filteredValue.ROOT_QUERY };
        Object.keys(rootQuery).forEach((key) => {
          // Never persist analytics data between refreshes
          if (
            key.startsWith('insights(') ||
            key.startsWith('insightsRatingDetails(')
          ) {
            delete rootQuery[key];
          }
        });
        filteredValue.ROOT_QUERY = rootQuery;
      }
      valueToPersist = JSON.stringify(filteredValue);
      await this.storage.setItem(key, JSON.stringify(value));
    }
    await this.storage.setItem(key, valueToPersist);
  }
}

export async function getPersistorAsync() {
  if (!persistorSingleton) {
    const options: ApolloPersistOptions<NormalizedCacheObject, false> = {
      key: PERSIST_KEY,
      cache: cacheSingleton,
      storage: new FilteringStorage(getLocalForage()),
      serialize: false,
      maxSize: 20 * 1000 * 1000, // ~20MB
      // Their debounce is literally just a window.setTimeout. Implement our own
      // proper debounce.
      trigger: onCacheWrite,
      debounce: 0,
    };
    // @ts-ignore - second generic isn't threaded through CachePersistor
    persistorSingleton = new CachePersistor(options);

    const span = trackSpan('persistor_restore');
    await persistorSingleton.restore();
    span.end(await telemetryData());

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          pauseSync();
        } else {
          resumeSync();
        }
      },
      false
    );

    window.setTimeout(async () => {
      const start = new Date().getTime();
      const collected = cacheSingleton.gc();
      const end = new Date().getTime();
      if (collected.length > 0) {
        trackTelemetry(
          'cache_gc',
          await telemetryData({
            duration_ms: end - start,
            items_collected: collected.length,
          })
        );
      }
    }, 5000);

    // TODO: figure out a way to do this for localforage...
    // TODO: this is probably not safe, decide what to do
    // window.addEventListener('storage', async e => {
    //   if (e.key !== PERSIST_KEY || !persistorSingleton) {
    //     return;
    //   }
    //   console.log('Restored cache from different tab');
    //   // Only trigger a restore so we're not too out of date when we save/overwrite things
    //   await persistorSingleton.restore();
    // })
  }

  return persistorSingleton;
}

export function getCache() {
  return cacheSingleton;
}

export async function clearCache() {
  const persistor = await getPersistorAsync();
  await persistor.purge();
}
