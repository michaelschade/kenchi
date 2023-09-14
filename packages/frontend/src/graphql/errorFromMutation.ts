import { MutationResult } from '@apollo/client';

import { KenchiErrorFragment } from './generated';

type ModifyData = {
  modify: {
    error: KenchiErrorFragment | null;
  };
};

export type ModifyResult = Pick<
  MutationResult<ModifyData>,
  'error' | 'data' | 'loading'
>;

export const errorFromMutation = (result: ModifyResult) => {
  return result?.error || result?.data?.modify?.error;
};
