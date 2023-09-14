import { failure, success } from '@kenchi/shared/lib/Result';

import EmberSync, {
  EmberMessageBlob,
} from '../pageData/variableExtractors/EmberSync';
import { IntercomExtractor } from '../pageData/variableExtractors/intercom';
import { PageActionRunner } from './types';

const extractIntercomData: PageActionRunner<'extractIntercomData'> = async ({
  pageDataController,
}) => {
  // TODO: Eliminate getExtractor from the page controller interface
  const intercomExtractor = pageDataController.getExtractor(
    'intercom'
  ) as IntercomExtractor | null;
  const emberSync = intercomExtractor?.getEmberSync();
  // TODO: better error handling (this TODO carried over during a refactor)
  if (!emberSync) {
    return failure({
      message: 'Unable to extract data from Intercom',
    });
  }
  let data;
  try {
    data = await waitForData(emberSync, 5000);
  } catch (e) {
    return failure({
      message: 'Timed out while trying to extract data from Intercom',
    });
  }
  if (!data) {
    return failure({
      message: 'Unable to extract data from Intercom',
    });
  }
  return success(data);
};

const waitForData = (
  emberSync: EmberSync,
  timeout: number
): Promise<EmberMessageBlob[]> => {
  emberSync.trackModelType('saved-reply');
  return new Promise((resolve, reject) => {
    let timeoutCount = Math.ceil(timeout / 500);
    let lastCount = 0;
    const interval = setInterval(() => {
      const newCount = Object.keys(
        emberSync.recordsByType['saved-reply'] || {}
      ).length;
      // Once we get a count and it's been stable for 500ms, return it.
      if (newCount > 0 && newCount === lastCount) {
        clearInterval(interval);
        const replies = emberSync.recordsByType['saved-reply'];
        resolve(
          Object.values(replies).map((o) => ({ ...o.columnValues, ...o.extra }))
        );
      } else if (--timeoutCount <= 0) {
        clearInterval(interval);
        reject();
      } else {
        lastCount = newCount;
      }
    }, 500);
  });
};
export default extractIntercomData;
