import { useContext } from 'react';

import { ParsedQs } from 'qs';

import {
  OptsForSetQueryParams,
  QueryParamsContext,
} from './QueryParamsProvider';

type SimpleQueryParams = Record<string, string | undefined>;

function dropNonStringValues(obj: ParsedQs): SimpleQueryParams {
  const rtn: SimpleQueryParams = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'string') {
      rtn[key] = value;
    }
  });
  return rtn;
}

export const isParsedQs = (obj: unknown): obj is ParsedQs => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Object.keys(obj).every((key) => {
      return (
        typeof obj[key as keyof typeof obj] === 'string' ||
        isParsedQs(obj[key as keyof typeof obj])
      );
    })
  );
};

type UseQueryParamsReturn<T> = [
  T,
  (params: T, opts?: OptsForSetQueryParams) => void
];

export function useSimpleQueryParams(): UseQueryParamsReturn<SimpleQueryParams> {
  const [queryParams, setQueryParams] = useQueryParams();
  return [dropNonStringValues(queryParams), setQueryParams];
}

export function useQueryParams(): UseQueryParamsReturn<ParsedQs> {
  const context = useContext(QueryParamsContext);
  if (!context) {
    throw new Error('useQueryParams must be used within a QueryParamsProvider');
  }

  return [context.queryParams, context.setQueryParams];
}
