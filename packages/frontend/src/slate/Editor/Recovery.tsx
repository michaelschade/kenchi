import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { captureMessage } from '@sentry/react';
import isEqual from 'fast-deep-equal';
import maxBy from 'lodash/maxBy';
import { useHistory } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { randomString } from '../../utils';
import getLocalForage from '../../utils/localForage';
import Editor, { EditorProps } from '.';

/**
 * Recovery has 3 parts that work together to make recovery possible:
 * 1. RecoveryProvider, which communicates with localForage to store the
 *    recovery data, syncs it to useState, and provides it out via a Context to
 *    those who need it.
 * 2. useRecovery, which provides the information needed to render a recovery
 *    dialog (is there recovery data available, when's it from, and callbacks to
 *    ignore or use it).
 * 3. RecoveryEditor (an implementation of RecoveryWrapper), which wraps a
 *    single editor in two additions:
 *    - A way to communicate its value back to RecoveryProvider so it can be
 *      stored
 *    - A way to be told "a recovery has been requested" so it can replace its
 *      value with the saved one.
 */

const RECOVERY_PREFIX = 'recovery';

type ContextType = {
  updateRecovery: (key: string, contents: SlateNode[]) => void;
  getRecovery: (key: string) => SlateNode[] | undefined;
  shouldRecover: boolean;
  hasRecovery: number | null;
  recover: () => void;
  dropRecovery: () => void;
};
const Context = createContext<ContextType | null>(null);

type RecoveryData = {
  lastUpdated: number;
  data: Record<string, SlateNode[]>;
};

type RecoveryCollection = {
  ignore: boolean; // Used to hide the modal but keep the data around
  entries: Record<string, RecoveryData>;
};

// We want to keep the recovery data from every page load, in case the user
// crashes, refreshes the page, makes some edits, and *then* realizes something
// bad happened. We'd have to manually yoink their IndexedDB to recover this,
// but it's better than nothing.
const appInstanceId = randomString(10);

async function getRecoveryCollection(
  storageKey: string
): Promise<RecoveryCollection | null> {
  const collection = await getLocalForage().getItem<RecoveryCollection>(
    storageKey
  );
  if (!collection) {
    return null;
  }

  if (typeof collection !== 'object' || !('entries' in collection)) {
    captureMessage(`Invalid recovery collection format`, {
      extra: { collection },
    });
    return null;
  }
  return collection;
}

async function getLatestRecoveryData(
  storageKey: string
): Promise<RecoveryData | null> {
  const collection = await getRecoveryCollection(storageKey);
  if (!collection || collection.ignore) {
    return null;
  }

  const latestData = maxBy(
    Object.values(collection.entries),
    (data) => data.lastUpdated
  );

  if (
    latestData &&
    latestData.lastUpdated < new Date().getTime() - 24 * 60 * 60 * 1000
  ) {
    console.log(
      `Found old recovery data (${latestData.lastUpdated}), ignoring`
    );
    return null;
  }
  return latestData ?? null;
}

async function setLatestRecoveryData(
  storageKey: string,
  data: Record<string, SlateNode[]>
) {
  const collection: RecoveryCollection = (await getRecoveryCollection(
    storageKey
  )) || {
    ignore: false,
    entries: {},
  };
  collection.ignore = false;
  collection.entries[appInstanceId] = {
    lastUpdated: new Date().getTime(),
    data,
  };
  await getLocalForage().setItem(storageKey, collection);
}

async function ignoreRecoveryData(storageKey: string) {
  const collection = await getRecoveryCollection(storageKey);
  if (collection) {
    collection.ignore = true;
    await getLocalForage().setItem(storageKey, collection);
  }
}

async function gcRecoveryData() {
  const localForage = getLocalForage();
  const keys = await localForage.keys();
  const regex = new RegExp(`^${RECOVERY_PREFIX}:[^:]+:[^:]+$`);
  await Promise.all(
    keys
      .filter((key) => regex.test(key))
      .map(async (key) => {
        const collection = await getRecoveryCollection(key);
        if (!collection) {
          return;
        }
        let updated = false;
        for (const instanceId of Object.keys(collection.entries)) {
          const data = collection.entries[instanceId];
          if (
            data.lastUpdated <
            new Date().getTime() - 24 * 60 * 60 * 1000 * 7
          ) {
            delete collection.entries[instanceId];
            updated = true;
          }
        }
        if (Object.keys(collection.entries).length === 0) {
          await localForage.removeItem(key);
        } else if (updated) {
          await localForage.setItem(key, collection);
        }
      })
  );
}

export function RecoveryProvider({
  type,
  id,
  children,
}: {
  type: 'workflow' | 'tool';
  id: string | null;
  children: React.ReactNode | React.ReactNode[];
}) {
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [shouldRecover, setShouldRecover] = useState(false);
  const storageKey = `${RECOVERY_PREFIX}:${type}:${id}`;

  useEffect(() => {
    (async () => {
      setRecoveryData(await getLatestRecoveryData(storageKey));
      // This will cause us to GC every time you edit something, which is an
      // arbitrary heuristic but ~fine for now.
      gcRecoveryData();
    })();
  }, [storageKey]);

  const [initialValue, setInitialValue] = useState<Record<string, SlateNode[]>>(
    {}
  );
  const [value, setValue] = useState<Record<string, SlateNode[]>>({});
  const save = useDebouncedCallback(
    () => {
      if (isEqual(value, initialValue)) {
        ignoreRecoveryData(storageKey);
      } else {
        setLatestRecoveryData(storageKey, value);
      }
    },
    200,
    { maxWait: 500 }
  );

  const history = useHistory();
  useEffect(() => {
    const unregister = history.listen(() => {
      ignoreRecoveryData(storageKey);
      unregister();
    });
  }, [history, storageKey]);

  const hasRecovery = useMemo(() => {
    if (!recoveryData) {
      return null;
    }

    // Don't broadcast that we have recovery if we're currently doing one
    if (shouldRecover) {
      return null;
    }

    // Or if no values have actually changed.
    if (isEqual(value, recoveryData.data)) {
      return null;
    }
    return recoveryData.lastUpdated;
  }, [recoveryData, shouldRecover, value]);

  const dropRecovery = useCallback(() => {
    ignoreRecoveryData(storageKey);
    setRecoveryData(null);
  }, [storageKey]);

  const context = useMemo<ContextType>(
    () => ({
      updateRecovery: (key, contents) => {
        setValue((v) => ({ ...v, [key]: contents }));
        setInitialValue((v) => ({ [key]: contents, ...v }));
        save();
      },
      getRecovery: (key) => recoveryData?.data[key],
      shouldRecover,
      hasRecovery,
      recover: () => setShouldRecover(true),
      dropRecovery,
    }),
    [shouldRecover, hasRecovery, dropRecovery, save, recoveryData?.data]
  );
  return <Context.Provider value={context}>{children}</Context.Provider>;
}

export function useRecovery() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('Can only useRecovery inside of RecoveryProvider');
  }

  return {
    hasRecovery: context.hasRecovery,
    recover: context.recover,
    dropRecovery: context.dropRecovery,
  };
}

export function RecoveryWrapper({
  recoveryKey,
  onRecover,
  value,
  children,
}: {
  recoveryKey: string;
  onRecover: (value: SlateNode[]) => void;
  value: SlateNode[];
  children: React.ReactNode;
}) {
  const context = useContext(Context);
  const [recovered, setRecovered] = useState(!!context?.shouldRecover);
  if (!context) {
    throw new Error('Can only use RecoveryWrapper inside of RecoveryProvider');
  }

  useEffect(() => {
    if (context.shouldRecover && !recovered) {
      const value = context.getRecovery(recoveryKey);
      if (value) {
        onRecover(value);
        setRecovered(true);
      }
    }
  }, [context, onRecover, recoveryKey, recovered]);

  const { updateRecovery } = context;
  useEffect(() => {
    updateRecovery(recoveryKey, value);
  }, [updateRecovery, recoveryKey, value]);

  return <>{children}</>;
}

export function RecoveryEditor({
  recoveryKey,
  onChange,
  value,
  ...props
}: EditorProps & { recoveryKey: string }) {
  const [editorKey, incrementEditorKey] = useReducer(
    (current) => current + 1,
    0
  );

  return (
    <RecoveryWrapper
      recoveryKey={recoveryKey}
      onRecover={(newValue) => {
        onChange(newValue);
        incrementEditorKey();
      }}
      value={value}
    >
      <Editor key={editorKey} onChange={onChange} value={value} {...props} />
    </RecoveryWrapper>
  );
}
