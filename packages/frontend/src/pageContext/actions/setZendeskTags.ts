import { failure, success } from '@kenchi/shared/lib/Result';

import { PageActionRunner } from './types';

const setZendeskTags: PageActionRunner<'setZendeskTags'> = async (
  { messageRouter },
  { tags }
) => {
  try {
    await messageRouter.sendCommand('contentScript', 'injectScript', {
      name: 'zendesk',
    });
  } catch (error) {}
  const resp = await messageRouter.sendCommand('pageScript', 'zendeskSetTags', {
    tags,
  });
  if (resp.success) {
    return success(resp.data.map((name) => ({ label: name, id: name })));
  } else {
    return failure({ message: resp.error });
  }
};

export default setZendeskTags;
