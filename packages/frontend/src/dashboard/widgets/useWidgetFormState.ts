import isEqual from 'fast-deep-equal';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import { startingContents } from '../../workflow/WorkflowEditor';
import { Widget } from './types';

export const useWidgetFormState = (widget?: Widget) => {
  const contentsState = useFormState<SlateNode[]>(
    widget?.contents,
    startingContents,
    isEqual
  );

  return {
    contentsState,
  };
};
