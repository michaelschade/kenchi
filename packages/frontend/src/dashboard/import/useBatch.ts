import { useCallback, useEffect, useState } from 'react';

import groupBy from 'lodash/groupBy';
import pickBy from 'lodash/pickBy';

type PromiseState<T> =
  | { state: 'ready' }
  | { state: 'pending' }
  | { state: 'error'; error: Error }
  | { state: 'complete'; result: T };

type PromiseStateValue<T> = PromiseState<T>['state'];

type PromiseEntry<T> = {
  key: string;
  createPromise: PromiseFn<T>;
};

export type PromiseEntryState<T> = PromiseEntry<T> & PromiseState<T>;

type PromiseFn<T> = () => Promise<T>;

type UseBatchTuple<T> = [
  (entries: PromiseEntry<T>[]) => void,
  PromiseEntryState<T>[] | null
];

export const useBatch = <T>(concurrency: number = 8): UseBatchTuple<T> => {
  const [states, setStates] = useState<PromiseEntryState<T>[] | null>(null);

  const start = (entries: PromiseEntry<T>[]) => {
    // ensure we only have unique keys, because we use these to update state and
    // expect that downstream consumers will also use this to match promise
    // results to their original entry
    const duplicateKeys = Object.keys(
      pickBy(groupBy(entries, 'key'), (values) => values.length > 1)
    );
    if (duplicateKeys.length) {
      throw new Error(
        `useBatch expects unique keys, found duplicates for: ${duplicateKeys.join(
          ', '
        )}`
      );
    }

    setStates(
      entries.map((entry) => ({
        ...entry,
        state: 'ready',
      }))
    );
  };

  const updateEntry = useCallback(
    (
      key: string,
      fromState: PromiseStateValue<T>,
      newState: PromiseState<T>
    ) => {
      setStates(
        (prevStates) =>
          prevStates &&
          prevStates.map((entry) =>
            entry.key === key && entry.state === fromState
              ? { ...entry, ...newState }
              : entry
          )
      );
    },
    []
  );

  useEffect(() => {
    if (!states) {
      return;
    }

    const pending = states.filter((entry) => entry.state === 'pending');
    const ready = states.filter((entry) => entry.state === 'ready');
    const entriesToStart = ready.slice(
      0,
      Math.max(0, concurrency - pending.length)
    );

    entriesToStart.forEach((entry) => {
      updateEntry(entry.key, 'ready', {
        state: 'pending',
      });
      entry.createPromise().then(
        (result) => {
          updateEntry(entry.key, 'pending', {
            state: 'complete',
            result,
          });
        },
        (error) => {
          updateEntry(entry.key, 'pending', {
            state: 'error',
            error,
          });
        }
      );
    });
  }, [concurrency, states, updateEntry]);

  return [start, states];
};
