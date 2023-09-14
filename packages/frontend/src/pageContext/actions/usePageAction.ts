import { useCallback, useState } from 'react';

import { Failure, isSuccess, Success } from '@kenchi/shared/lib/Result';

import { usePageDataController } from '../pageData/usePageDataController';
import {
  OptionalIfEmpty,
  PageActionRunnerError,
  PageActionRunnerResponse,
  PageActions,
  PageActionType,
} from './types';

export function usePageAction<TType extends PageActionType>(
  type: TType
): {
  runAction: (
    ...args: OptionalIfEmpty<PageActions[TType]['args']>
  ) => PageActionRunnerResponse<TType>;
  success: Success<PageActions[TType]['data']> | null;
  error: Failure<PageActionRunnerError> | null;
} {
  const pageController = usePageDataController();
  const [success, setResult] = useState<Success<
    PageActions[TType]['data']
  > | null>(null);
  const [error, setError] = useState<Failure<PageActionRunnerError> | null>(
    null
  );

  const runAction = useCallback(
    async (...args: OptionalIfEmpty<PageActions[TType]['args']>) => {
      const response = await pageController.runAction(type, ...args);
      if (isSuccess(response)) {
        setResult(response);
        setError(null);
      } else {
        setResult(null);
        setError(response);
      }

      return response;
    },
    [pageController, type]
  );

  return { runAction, success, error };
}
