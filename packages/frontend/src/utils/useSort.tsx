import { ParsedQs } from 'qs';

import {
  isSortDir,
  isSortTuple,
  SortTuple,
} from '@kenchi/ui/lib/Dashboard/Table';

import { isParsedQs, useQueryParams } from './useQueryParams';

type SortOptions = {
  namespace?: string;
};

const queryParamsObjForSortTuple = (sort: SortTuple, namespace?: string) => {
  if (namespace) {
    return {
      [namespace]: {
        sortBy: sort[0],
        sortDir: sort[1],
      },
    };
  }
  return {
    sortBy: sort[0],
    sortDir: sort[1],
  };
};

const extractParsedQs = (
  input: undefined | string | string[] | ParsedQs | ParsedQs[]
): ParsedQs => {
  if (!isParsedQs(input)) {
    return {};
  }
  return input;
};

const sortTupleForQueryParams = (
  maybeNamespacedQueryParams: ParsedQs,
  defaultSortTuple: SortTuple,
  namespace?: string
): SortTuple => {
  const queryParams = namespace
    ? extractParsedQs(maybeNamespacedQueryParams[namespace])
    : maybeNamespacedQueryParams;

  const { sortBy, sortDir } = queryParams;
  const sortTuple = [
    sortBy,
    isSortDir(sortDir) ? sortDir.toLocaleLowerCase() : defaultSortTuple[1],
  ];
  if (!isSortTuple(sortTuple)) {
    return defaultSortTuple;
  }

  return sortTuple;
};

export const useSort = (
  defaultSortTuple: SortTuple,
  options?: SortOptions
): [SortTuple, (sortTuple: SortTuple) => void] => {
  const { namespace } = options || {};
  const [queryParams, setQueryParams] = useQueryParams();

  const sortTuple = sortTupleForQueryParams(
    queryParams,
    defaultSortTuple,
    namespace
  );

  const setSort = (sortTuple: SortTuple) => {
    setQueryParams(queryParamsObjForSortTuple(sortTuple, namespace), {
      shouldReplaceState: true,
    });
  };

  return [sortTuple, setSort];
};
