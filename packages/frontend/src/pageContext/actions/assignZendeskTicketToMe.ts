import { failure, isSuccess, success } from '@kenchi/shared/lib/Result';

import { PageActionRunner } from './types';

const assignZendeskTicketToMe: PageActionRunner<
  'assignZendeskTicketToMe'
> = async ({ messageRouter }) => {
  try {
    await messageRouter.sendCommand('contentScript', 'injectScript', {
      name: 'zendesk',
    });
  } catch (error) {}
  const resp = await messageRouter.sendCommand('pageScript', 'zendeskAssignMe');
  if (isSuccess(resp)) {
    return success(resp.data);
  } else {
    return failure({ message: resp.error });
  }
};

export default assignZendeskTicketToMe;
