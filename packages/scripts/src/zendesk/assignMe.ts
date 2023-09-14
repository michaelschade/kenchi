import { Commands } from '@kenchi/commands';

import { handleLocalRequest } from './localRequest';
import { getApp, getRuntime } from './runtime';
import { Assignee } from './types';
import { getActiveVariables } from './variables';

export async function assignMe(): Promise<
  Commands['pageScript']['zendeskAssignMe']['resp']
> {
  const sidebarRuntime = getRuntime(
    (r) => r.location === 'ticket_sidebar' && r.isActive
  );

  if (!sidebarRuntime) {
    return {
      success: false,
      error: 'Must be logged in and on main Zendesk app',
    };
  }
  const { currentUser, ticket } = await getActiveVariables();
  if (!currentUser || !ticket) {
    return { success: false, error: 'No active user or ticket' };
  }
  const { assignee } = ticket;
  if (assignee.user !== null && currentUser.id === assignee.user.id) {
    return {
      success: true,
      data: assignee,
    };
  }

  const app = await getApp(sidebarRuntime);
  const { id: userId, groups } = currentUser;
  const userGroupIds = groups.map((g) => g.id);
  const groupId = userGroupIds.includes(assignee.group.id)
    ? assignee.group.id
    : userGroupIds[0];

  const response = await handleLocalRequest(sidebarRuntime, app, 'set', {
    'ticket.assignee': { groupId, userId },
  });

  if (!('ticket.assignee' in response)) {
    const {
      errors: {
        'ticket.assignee': { message },
      },
    } = response as any;
    return { success: false, error: message };
  }
  return {
    success: true,
    data: response['ticket.assignee'] as Assignee,
  };
}
