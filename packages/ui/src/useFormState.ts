import { useCallback, useState } from 'react';

// This hook helps us with the scenario where the component gets passed an object that may or may not yet be loaded, and we use that object to populate the initial state for the form. If the object starts as null, and the initial state is null, then we'll sometimes get an edit form with a blank field. We always return the current form field state if it's been manually set via an onChange handler, otherwise we return the backend value or unset value.

export type FormState<Value> = {
  readonly value: Value;
  readonly set: (newValue: Value) => void;
  readonly hasChanged: boolean;
  readonly reset: () => void;
};

export const useFormState = <Value>(
  backendValue: Value | undefined,
  unsetValue: Value,
  isEqual: (left: Value, right: Value) => boolean = (left, right) =>
    left === right
): FormState<Value> => {
  const [fieldValue, setFieldValue] = useState<Value | undefined>(undefined);

  const initialValue = backendValue !== undefined ? backendValue : unsetValue;
  const hasChanged = useCallback(() => {
    if (fieldValue !== undefined) {
      return !isEqual(fieldValue, initialValue);
    }
    return false;
  }, [fieldValue, initialValue, isEqual]);

  if (fieldValue !== undefined) {
    return {
      value: fieldValue,
      set: setFieldValue,
      get hasChanged() {
        return hasChanged();
      },
      reset: () => setFieldValue(undefined),
    };
  }

  if (backendValue !== undefined) {
    return {
      value: backendValue,
      set: setFieldValue,
      hasChanged: false,
      reset: () => setFieldValue(undefined),
    };
  }
  return {
    value: unsetValue,
    set: setFieldValue,
    hasChanged: false,
    reset: () => setFieldValue(undefined),
  };
};
