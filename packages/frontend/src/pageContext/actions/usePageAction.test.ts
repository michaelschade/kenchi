import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';

import { success } from '@kenchi/shared/lib/Result';

import { buildPageDataController } from '../../test/helpers/pageDataController';
import { usePageDataController } from '../pageData/usePageDataController';
import { usePageAction } from './usePageAction';

jest.mock('../pageData/usePageDataController');
const mockPageController = usePageDataController as jest.MockedFunction<
  typeof usePageDataController
>;

// TODO: figure out how to stub out actions
const TEST_ACTION = 'extractZendeskTags' as const;

it('inits with null result and error', async () => {
  const {
    result: {
      current: { success, error },
    },
  } = renderHook(() => usePageAction(TEST_ACTION));
  expect(success).toBeNull();
  expect(error).toBeNull();
});

it('sets the result on a successful action', async () => {
  const mockResult = success([{ label: 'test', id: 'test' }]);
  mockPageController.mockReturnValue(
    buildPageDataController({
      overrides: {
        runAction: jest.fn().mockResolvedValue(mockResult),
      },
    })
  );
  const { result: hookResult } = renderHook(() => usePageAction(TEST_ACTION));

  act(() => {
    hookResult.current.runAction();
  });

  await waitFor(() => {
    const {
      current: { success, error },
    } = hookResult;
    expect(success).toEqual(mockResult);
    expect(error).toBeNull();
  });
});

it('sets the error on a failed action', async () => {
  const mockResult = {
    status: 'error',
    errorMessage: 'Bad things happened',
  };
  mockPageController.mockReturnValue(
    buildPageDataController({
      overrides: {
        runAction: jest.fn().mockResolvedValue(mockResult),
      },
    })
  );
  const { result: hookResult } = renderHook(() => usePageAction(TEST_ACTION));

  act(() => {
    hookResult.current.runAction();
  });

  await waitFor(() => {
    const {
      current: { success, error },
    } = hookResult;
    expect(success).toBeNull();
    expect(error).toEqual(mockResult);
  });
});
