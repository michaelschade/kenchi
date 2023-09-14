import { handleLocalRequest } from './localRequest';
import { getApp, getRuntime } from './runtime';
import { Ticket, User } from './types';

export async function getActiveVariables(): Promise<{
  currentUser?: User;
  ticket?: Ticket;
}> {
  const sidebarRuntime = getRuntime(
    (r) => r.location === 'ticket_sidebar' && r.isActive
  );

  if (!sidebarRuntime) {
    return {};
  }

  const app = await getApp(sidebarRuntime);

  const { currentUser, ticket } = (await handleLocalRequest(
    sidebarRuntime,
    app,
    'get',
    ['currentUser', 'ticket']
  )) as { currentUser: User; ticket: Ticket };

  return { currentUser, ticket };
}
