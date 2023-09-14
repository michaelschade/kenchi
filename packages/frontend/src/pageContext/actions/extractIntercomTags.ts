import { success } from '@kenchi/shared/lib/Result';

import { filterNullOrUndefined } from '../../utils';
import { IntercomExtractor } from '../pageData/variableExtractors/intercom';
import { PageActionRunner } from './types';

const extractIntercomTags: PageActionRunner<'extractIntercomTags'> = async ({
  pageDataController,
}) => {
  // TODO: I think this can be generalized rather than explicitly requesting the intercom extractor
  const intercomExtractor = pageDataController.getExtractor(
    'intercom'
  ) as IntercomExtractor | null;
  if (!intercomExtractor) {
    return success([]);
  }
  const results = await intercomExtractor.getTags();
  const nonNullResults = results.filter(filterNullOrUndefined);
  const data = nonNullResults.length === 0 ? [] : nonNullResults.flat();
  return success(data);
};

export default extractIntercomTags;
