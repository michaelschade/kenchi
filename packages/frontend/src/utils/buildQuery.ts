import { cloneDeep, mergeWith } from 'lodash';
import { ParsedQs, stringify } from 'qs';

const buildQuery = (
  currentParams: Readonly<ParsedQs>,
  updates: Readonly<ParsedQs>
): string => {
  const clonedCurrentParams = cloneDeep(currentParams);
  mergeWith(
    clonedCurrentParams,
    updates,
    (
      _objValue: string,
      srcValue: string | undefined,
      key: string,
      object: { [key: string]: string | ParsedQs | undefined }
    ) => {
      if (srcValue === undefined) {
        object[key] = undefined;
      }
      // Implicitly returning undefined here falls back to lodash's default
      // merge behavior
    }
  );

  return stringify(clonedCurrentParams, {
    arrayFormat: 'indices',
    encodeValuesOnly: true,
  });
};

export default buildQuery;
