import { act, renderHook } from '@testing-library/react-hooks';
import { createMemoryHistory, MemoryHistoryBuildOptions } from 'history';
import { Router } from 'react-router-dom';

import { SortTuple } from '@kenchi/ui/lib/Dashboard/Table';

import { QueryParamsProvider } from './QueryParamsProvider';
import { useSort } from './useSort';

const DEFAULT_SORT_TUPLE: SortTuple = ['defaultColumnToSortBy', 'asc'];

type OptionsForRender = {
  initialPath?: string;
  namespace?: string;
};

const renderWithUseSort = (options?: OptionsForRender) => {
  const historyOptions: MemoryHistoryBuildOptions = {};
  if (options?.initialPath) {
    historyOptions.initialEntries = [options.initialPath];
  }
  const history = createMemoryHistory(historyOptions);
  const wrapper = ({ children }: { children: React.ReactChild }) => (
    <Router history={history}>
      <QueryParamsProvider>{children}</QueryParamsProvider>
    </Router>
  );
  return {
    ...renderHook(
      () =>
        useSort(DEFAULT_SORT_TUPLE, {
          namespace: options?.namespace,
        }),
      { wrapper }
    ),
    history,
  };
};

test('defaults to the default sort tuple with there are no sort query params', () => {
  const { result, history } = renderWithUseSort();
  expect(history.location.search).toEqual('');
  expect(result.current[0]).toEqual(['defaultColumnToSortBy', 'asc']);
});

test('defaults to asc when sortDir is invalid', () => {
  const { result } = renderWithUseSort({
    initialPath: '/?sortBy=this_is_fine&sortDir=invalid_direction',
  });
  expect(result.current[0]).toEqual(['this_is_fine', 'asc']);
});

test('does not care about the case of sortDir', () => {
  const { result } = renderWithUseSort({
    initialPath: '/?sortBy=this_is_fine&sortDir=DESC',
  });
  expect(result.current[0]).toEqual(['this_is_fine', 'desc']);
});

test('syncs from non-namespaced query params', () => {
  const { result } = renderWithUseSort({
    initialPath: '/?sortBy=collection&sortDir=desc',
  });
  expect(result.current[0]).toEqual(['collection', 'desc']);
});

test('syncs from namespaced query params', () => {
  const { result } = renderWithUseSort({
    initialPath:
      '/?someNamespace[sortBy]=favoriteColor&someNamespace[sortDir]=asc',
    namespace: 'someNamespace',
  });
  expect(result.current[0]).toEqual(['favoriteColor', 'asc']);
});

test('syncs to non-namedspaced query params when the sort changes', () => {
  const { result, history } = renderWithUseSort();
  act(() => {
    result.current[1](['favoriteTypeOfFlower', 'desc']);
  });
  expect(history.location.search).toEqual(
    '?sortBy=favoriteTypeOfFlower&sortDir=desc'
  );
  expect(result.current[0]).toEqual(['favoriteTypeOfFlower', 'desc']);
});

test('syncs to namedspaced query params when the sort changes', () => {
  const { result, history } = renderWithUseSort({
    namespace: 'whatANamespace',
  });
  act(() => {
    result.current[1](['favoriteTypeOfFlower', 'desc']);
  });
  expect(history.location.search).toEqual(
    '?whatANamespace[sortBy]=favoriteTypeOfFlower&whatANamespace[sortDir]=desc'
  );
  expect(result.current[0]).toEqual(['favoriteTypeOfFlower', 'desc']);
});

test('returns the correct sorting params when there are array params too', () => {
  const { result } = renderWithUseSort({
    initialPath:
      '?sortBy=stuff&sortDir=desc&collection[0]=foo&collection[1]=bar',
  });
  expect(result.current[0]).toEqual(['stuff', 'desc']);
});
