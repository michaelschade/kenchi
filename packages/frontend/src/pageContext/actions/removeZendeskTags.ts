import { failure, success } from '@kenchi/shared/lib/Result';

import { PageActionRunner } from './types';

const removeZendeskTags: PageActionRunner<'removeZendeskTags'> = async (
  { messageRouter },
  { tags }
) => {
  try {
    await messageRouter.sendCommand('contentScript', 'injectScript', {
      name: 'zendesk',
    });
  } catch (error) {}
  const resp = await messageRouter.sendCommand(
    'pageScript',
    'zendeskRemoveTags',
    { tags }
  );
  if (resp.success) {
    return success(resp.data.map((name) => ({ label: name, id: name })));
  } else {
    return failure({ message: resp.error });
  }
};

export default removeZendeskTags;
