import isEqual from 'fast-deep-equal';
import { pick } from 'lodash';

import { CollectionWidget } from '@kenchi/slate-tools/lib/types';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import { SpaceEditorFragment } from '../../graphql/generated';
import { filterNullOrUndefined } from '../../utils';
import { WidgetFormState } from './types';

export const useSpaceFormState = (space?: SpaceEditorFragment | null) => {
  const visibleToOrgState = useFormState<boolean>(space?.visibleToOrg, true);
  const groupIdsState = useFormState<string[]>(
    space?.acl
      .map((entry) => entry.userGroup?.id)
      .filter(filterNullOrUndefined),
    []
  );
  const nameState = useFormState<string>(space?.name, '');

  // TODO: make widgets typed
  const widgets: CollectionWidget[] | undefined = space?.widgets;
  const widgetsState = useFormState<WidgetFormState[]>(
    widgets?.map((widget) => ({
      type: 'collection',
      id: widget.collectionId,
      editing: false,
    })),
    [],
    // This doesn't quite feel right. But it's useful to keep form state that
    // should be factored into whether the  data is dirty or not
    (left, right) =>
      isEqual(
        left.map((formState) => pick(formState, 'id')),
        right.map((formState) => pick(formState, 'id'))
      )
  );

  const hasChanges =
    nameState.hasChanged ||
    visibleToOrgState.hasChanged ||
    groupIdsState.hasChanged ||
    widgetsState.hasChanged;

  const resetAllFormStates = () => {
    Object.values(formStates).forEach((state) => state.reset());
  };

  const formStates = {
    nameState,
    visibleToOrgState,
    groupIdsState,
    widgetsState,
  };
  return {
    ...formStates,
    resetAllFormStates,
    hasChanges,
  };
};
