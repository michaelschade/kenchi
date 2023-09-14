import { act, renderHook } from '@testing-library/react-hooks';
import { createMemoryHistory, MemoryHistoryBuildOptions } from 'history';
import { Router } from 'react-router-dom';

import { QueryParamsProvider } from './QueryParamsProvider';
import { useQueryParams } from './useQueryParams';

type OptionsForRender = {
  initialPath?: string;
};

const renderWithUseQueryParams = (options?: OptionsForRender) => {
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
    ...renderHook(() => useQueryParams(), { wrapper }),
    history,
  };
};

test('queryParams is an empty object if no query params on url', () => {
  const {
    result: {
      current: [queryParams],
    },
  } = renderWithUseQueryParams();
  expect(queryParams).toEqual({});
});

test('queryParams contains the query params from the initial url', () => {
  const {
    result: {
      current: [queryParams],
    },
  } = renderWithUseQueryParams({
    initialPath: '/?omg=wow&this=is_the_best',
  });
  expect(queryParams).toEqual({
    omg: 'wow',
    this: 'is_the_best',
  });
});

test('setting query params updates the url and queryParams accordingly', () => {
  const { result, history } = renderWithUseQueryParams();
  act(() => {
    result.current[1]({
      yay: 'new_query_params',
    });
  });
  expect(result.current[0]).toEqual({
    yay: 'new_query_params',
  });
  expect(history.location.search).toEqual('?yay=new_query_params');
});

test('multiple push updates at once do not get clobbered', () => {
  const { result, history } = renderWithUseQueryParams();
  act(() => {
    result.current[1]({
      yay: 'first',
    });
    result.current[1]({
      wow: 'second',
    });
  });
  expect(history.location.search).toEqual('?yay=first&wow=second');
});

test('multiple replace updates at once do not get clobbered', () => {
  const { result, history } = renderWithUseQueryParams();
  act(() => {
    result.current[1](
      {
        yay: 'first',
      },
      {
        shouldReplaceState: true,
      }
    );
    result.current[1](
      {
        wow: 'second',
      },
      { shouldReplaceState: true }
    );
  });
  expect(history.location.search).toEqual('?yay=first&wow=second');
});

test('multiple replace updates of the same param results in only the last value', () => {
  const { result, history } = renderWithUseQueryParams();
  act(() => {
    result.current[1](
      {
        yay: 'first',
      },
      {
        shouldReplaceState: true,
      }
    );
    result.current[1](
      {
        yay: 'second',
      },
      { shouldReplaceState: true }
    );
  });
  expect(history.location.search).toEqual('?yay=second');
});

test('push followed by replace results in both sets of params', async () => {
  const { result, history } = renderWithUseQueryParams();
  act(() => {
    result.current[1](
      {
        first: 'from_push',
      },
      { shouldReplaceState: false } // this is the default
    );
    result.current[1](
      {
        second: 'from_replace',
      },
      { shouldReplaceState: true }
    );
  });
  expect(result.current[0]).toEqual({
    first: 'from_push',
    second: 'from_replace',
  });
  expect(history.location.search).toEqual(
    '?first=from_push&second=from_replace'
  );
});

test('replace followed by push results in both params', () => {
  const { result, history } = renderWithUseQueryParams();
  act(() => {
    result.current[1](
      {
        first: 'from_replace',
      },
      { shouldReplaceState: true }
    );
    result.current[1](
      {
        second: 'from_push',
      },
      { shouldReplaceState: false }
    );
  });
  expect(result.current[0]).toEqual({
    first: 'from_replace',
    second: 'from_push',
  });
  expect(history.location.search).toEqual(
    '?first=from_replace&second=from_push'
  );
});

test('empty updates do not call the history API', async () => {
  const {
    result: {
      current: [params, applyUpdate],
    },
    history,
  } = renderWithUseQueryParams();
  history.replace = jest.fn();
  history.push = jest.fn();

  act(() => {
    applyUpdate({}, { shouldReplaceState: true });
    applyUpdate({ awesome: undefined }, { shouldReplaceState: true });
    applyUpdate({}, { shouldReplaceState: false });
    applyUpdate({ awesome: undefined }, { shouldReplaceState: false });
  });

  expect(params).toEqual({});
  expect(history.replace).not.toBeCalled();
  expect(history.push).not.toBeCalled();
});

test('updates that do not modify the URL do not call the history API', async () => {
  const {
    result: {
      current: [params, applyUpdate],
    },
    history,
  } = renderWithUseQueryParams({ initialPath: '/?awesome=wow' });
  history.replace = jest.fn();
  history.push = jest.fn();

  act(() => {
    applyUpdate({ awesome: 'wow' }, { shouldReplaceState: true });
    applyUpdate({ awesome: 'wow' }, { shouldReplaceState: true });
    applyUpdate({ awesome: 'wow' }, { shouldReplaceState: false });
  });

  expect(params).toEqual({ awesome: 'wow' });
  expect(history.replace).not.toBeCalled();
  expect(history.push).not.toBeCalled();
});
