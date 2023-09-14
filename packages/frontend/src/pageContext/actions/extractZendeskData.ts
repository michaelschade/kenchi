import { failure, success } from '@kenchi/shared/lib/Result';

import { PageActionRunner } from './types';

const extractZendeskData: PageActionRunner<'extractZendeskData'> = async ({
  messageRouter,
}) => {
  try {
    await messageRouter.sendCommand('contentScript', 'injectScript', {
      name: 'zendesk',
    });
  } catch (error) {}
  const resp = await messageRouter.sendCommand(
    'pageScript',
    'zendeskGetMacros'
  );
  if (resp.success) {
    return success(resp.data);
  } else {
    return failure(resp.error);
  }
};

export default extractZendeskData;
