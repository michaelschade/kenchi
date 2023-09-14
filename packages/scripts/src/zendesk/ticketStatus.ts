import { Commands } from '@kenchi/commands';

import { handleLocalRequest } from './localRequest';
import { getApp, getRuntime } from './runtime';

export async function setTicketStatus(
  ticketStatus: string
): Promise<Commands['pageScript']['zendeskSetTicketStatus']['resp']> {
  const sidebarRuntime = getRuntime(
    (r) => r.location === 'ticket_sidebar' && r.isActive
  );

  if (!sidebarRuntime) {
    return {
      success: false,
      error: 'Must be logged in and on main Zendesk app',
    };
  }
  const app = await getApp(sidebarRuntime);

  const response = await handleLocalRequest(sidebarRuntime, app, 'set', {
    'ticket.status': ticketStatus,
  });
  if (
    !('ticket.status' in response) ||
    response['ticket.status'] !== ticketStatus
  ) {
    const {
      errors: {
        'ticket.status': { message },
      },
    } = response as any;
    return { success: false, error: message };
  }
  return { success: true, data: response['ticket.status'] as string };
}
