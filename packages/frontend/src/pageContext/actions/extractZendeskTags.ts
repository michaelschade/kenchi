import { failure, isSuccess, success } from '@kenchi/shared/lib/Result';

import { PageActionRunner } from './types';

const extractZendeskTags: PageActionRunner<'extractZendeskTags'> = async ({
  messageRouter,
}) => {
  try {
    await messageRouter.sendCommand('contentScript', 'injectScript', {
      name: 'zendesk',
    });
  } catch (error) {}
  const resp = await messageRouter.sendCommand(
    'pageScript',
    'zendeskExtractTags'
  );
  if (isSuccess(resp)) {
    return success(resp.data.map(({ name }) => ({ label: name, id: name })));
  } else {
    return failure(resp.error);
  }
};

export default extractZendeskTags;
