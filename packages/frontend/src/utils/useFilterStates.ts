import { useCallback, useEffect, useMemo, useState } from 'react';

import { ParsedQs } from 'qs';

import {
  FilterStates,
  GenericFilterConfigs,
} from '@kenchi/ui/lib/Dashboard/TableFilter';

import { SetPage } from './paginationTypes';
import { useQueryParams } from './useQueryParams';

function filterStatesForQueryParams<
  TItem,
  TConfigs extends GenericFilterConfigs<TItem>
>(
  defaultFilterStates: FilterStates<TItem, TConfigs> = {},
  queryParams: ParsedQs,
  filterConfigs: TConfigs,
  namespace?: string
): FilterStates<TItem, TConfigs> {
  const values = namespace ? queryParams[namespace] : queryParams;
  if (!values || !(typeof values === 'object') || Array.isArray(values)) {
    return defaultFilterStates;
  }
  // No way to get this to typecheck with TConfigs given the generic nature of
  // GenericFilterConfigs.
  const filterStates: FilterStates<TItem, any> = defaultFilterStates;
  for (const key in filterConfigs) {
    const rawValue = values?.[key];
    if (rawValue) {
      const converter = filterConfigs[key].component.convertFromQueryParam;
      const value = converter ? converter(rawValue) : rawValue;
      filterStates[key] = { isOn: true, value };
    }
  }
  return filterStates;
}

function queryParamsForFilterStates<
  TItem,
  TConfigs extends GenericFilterConfigs<TItem>
>(
  filterConfigs: TConfigs,
  filterStates: FilterStates<TItem, TConfigs>,
  namespace?: string
): ParsedQs {
  const queryParams: ParsedQs = {};
  Object.entries(filterStates).forEach(([key, filterState]) => {
    if (filterState.isOn && !!filterState.value) {
      queryParams[key] = filterState.value;
    } else {
      queryParams[key] = undefined;
    }
  });
  if (namespace) {
    return { [namespace]: queryParams };
  }
  return queryParams;
}

type UseFilterStatesOptions<
  TItem,
  TConfigs extends GenericFilterConfigs<TItem>
> = {
  defaultFilterStates?: FilterStates<TItem, TConfigs>;
  shouldSyncWithQueryParams?: boolean;
  queryParamNamespace?: string;
  setPage?: SetPage;
};

type UseFilterStatesReturn<
  TItem,
  TConfigs extends GenericFilterConfigs<TItem>
> = {
  filterStates: FilterStates<TItem, TConfigs>;
  setFilterStates: (filterStates: FilterStates<TItem, TConfigs>) => void;
  syncFilterStatesToQueryParams: () => void;
  activeFilterCount: number;
};

export function useFilterStates<
  TConfigs extends GenericFilterConfigs<any>,
  TItem = TConfigs extends GenericFilterConfigs<infer TItem> ? TItem : unknown
>(
  filterConfigs: TConfigs,
  options: UseFilterStatesOptions<TItem, TConfigs> = {}
): UseFilterStatesReturn<TItem, TConfigs> {
  const {
    shouldSyncWithQueryParams,
    queryParamNamespace,
    defaultFilterStates,
    setPage,
  } = options;

  const [queryParams, setQueryParams] = useQueryParams();
  const initialFilterStates = shouldSyncWithQueryParams
    ? filterStatesForQueryParams<TItem, TConfigs>(
        defaultFilterStates,
        queryParams,
        filterConfigs,
        queryParamNamespace
      )
    : {};
  const [filterStates, setFilterStates] =
    useState<FilterStates<TItem, TConfigs>>(initialFilterStates);

  if (queryParamNamespace && !shouldSyncWithQueryParams) {
    throw new Error(
      'Can only provide queryParamNamespace if shouldSyncWithQueryParams is true'
    );
  }

  const syncFilterStatesToQueryParams = useCallback(() => {
    const queryParams = queryParamsForFilterStates(
      filterConfigs,
      filterStates,
      queryParamNamespace
    );

    setPage?.(1);
    setQueryParams({ ...queryParams });
  }, [
    filterConfigs,
    filterStates,
    queryParamNamespace,
    setPage,
    setQueryParams,
  ]);

  useEffect(() => {
    if (shouldSyncWithQueryParams) {
      setFilterStates(
        filterStatesForQueryParams<TItem, TConfigs>(
          defaultFilterStates,
          queryParams,
          filterConfigs,
          queryParamNamespace
        )
      );
    }
  }, [
    defaultFilterStates,
    filterConfigs,
    queryParamNamespace,
    queryParams,
    shouldSyncWithQueryParams,
  ]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filterStates).filter((filterState) => filterState.isOn)
      .length;
  }, [filterStates]);

  return {
    filterStates,
    setFilterStates,
    syncFilterStatesToQueryParams,
    activeFilterCount,
  };
}
