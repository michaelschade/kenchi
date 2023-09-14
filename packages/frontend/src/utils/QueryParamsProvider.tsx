import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { parse, ParsedQs } from 'qs';
import { useHistory, useLocation } from 'react-router-dom';

import buildQuery from './buildQuery';

export type OptsForSetQueryParams = {
  shouldReplaceState?: boolean;
};

type QueryParamsContextType = {
  setQueryParams: (queryParams: ParsedQs, opts?: OptsForSetQueryParams) => void;
  queryParams: ParsedQs;
};

export const QueryParamsContext = createContext<QueryParamsContextType | null>(
  null
);

enum UpdateType {
  push = 'push',
  replace = 'replace',
}

type Update = {
  updateType: UpdateType;
  queryParams: ParsedQs;
};

const mergeUpdates = (updates: Update[]): Update => {
  // Takes a set of query param updates and merges them into a single Update (an
  // object of query params to apply, and an update mechanism of either via push
  // or replace).

  const updateTypeForMergedUpdates = updates.some(
    (update) => update.updateType === UpdateType.push
  )
    ? UpdateType.push
    : UpdateType.replace;

  const mergedQueryParams = updates.reduce(
    (mergedQueryParams, update) => ({
      ...mergedQueryParams,
      ...update.queryParams,
    }),
    {}
  );

  return {
    queryParams: mergedQueryParams,
    updateType: updateTypeForMergedUpdates,
  };
};

export const QueryParamsProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const location = useLocation();
  const history = useHistory();
  const parsedQueryParams = useMemo(
    () => parse(location.search, { ignoreQueryPrefix: true }),
    [location.search]
  );

  const updatesQueue = useRef<Update[]>([]);
  const [updateTracker, incrUpdateTracker] = useReducer((i) => i + 1, 0);

  const setQueryParams = useCallback(
    (
      queryParams: ParsedQs,
      opts: OptsForSetQueryParams = { shouldReplaceState: false }
    ) => {
      updatesQueue.current.push({
        queryParams,
        updateType: opts.shouldReplaceState
          ? UpdateType.replace
          : UpdateType.push,
      });
      incrUpdateTracker();
    },
    []
  );

  const applyUpdate = useCallback(
    (update: Update) => {
      const { updateType, queryParams } = update;
      const queryStringWithUpdates = buildQuery(parsedQueryParams, queryParams);
      const currentQueryString = location.search;
      const normalizedCurrentQueryString = currentQueryString.startsWith('?')
        ? currentQueryString.slice(1)
        : currentQueryString;

      if (queryStringWithUpdates !== normalizedCurrentQueryString) {
        if (updateType === UpdateType.replace) {
          history.replace({
            ...location,
            search: queryStringWithUpdates,
          });
        } else {
          history.push({
            ...location,
            search: queryStringWithUpdates,
          });
        }
      }

      updatesQueue.current = [];
    },
    [history, location, parsedQueryParams]
  );

  useEffect(() => {
    if (updatesQueue.current.length) {
      const mergedUpdate = mergeUpdates(updatesQueue.current);
      applyUpdate(mergedUpdate);
    }
  }, [applyUpdate, history, updateTracker]);

  const value = useMemo(
    () => ({
      setQueryParams,
      queryParams: parsedQueryParams,
    }),
    [setQueryParams, parsedQueryParams]
  );

  return (
    <QueryParamsContext.Provider value={value}>
      {children}
    </QueryParamsContext.Provider>
  );
};
