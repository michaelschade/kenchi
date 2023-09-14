import { failure, success } from '@kenchi/shared/lib/Result';

import { PageActionRunner } from './types';

const setZendeskTicketStatus: PageActionRunner<
  'setZendeskTicketStatus'
> = async ({ messageRouter }, { ticketStatus }) => {
  try {
    await messageRouter.sendCommand('contentScript', 'injectScript', {
      name: 'zendesk',
    });
  } catch (error) {}
  const resp = await messageRouter.sendCommand(
    'pageScript',
    'zendeskSetTicketStatus',
    { ticketStatus }
  );
  if (resp.success) {
    return success(resp.data);
  } else {
    return failure({
      message: resp.error,
    });
  }
};

export default setZendeskTicketStatus;
