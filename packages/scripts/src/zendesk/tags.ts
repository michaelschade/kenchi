import { Commands } from '@kenchi/commands';
import { failure, isFailure, success } from '@kenchi/shared/lib/Result';

import { getPaginated } from './apiRequest';
import { handleLocalRequest } from './localRequest';
import { getApp, getRuntime } from './runtime';

export async function addTags(
  tags: string[]
): Promise<Commands['pageScript']['zendeskAddTags']['resp']> {
  const sidebarRuntime = getRuntime(
    (r) => r.location === 'ticket_sidebar' && r.isActive
  );

  if (!sidebarRuntime) {
    return failure('Must be logged in and on main Zendesk app');
  }
  const app = await getApp(sidebarRuntime);

  const response = await handleLocalRequest(sidebarRuntime, app, 'invoke', {
    // This passes in the array of tags as the only item in an args array
    // e.g. [['tag1', 'tag2']]
    'ticket.tags.add': [tags],
  });

  if (!('ticket.tags.add' in response)) {
    const {
      errors: {
        'ticket.tags.add': { message },
      },
    } = response as any;
    return failure(message);
  }
  return success(response['ticket.tags.add'] as string[]);
}

export async function setTags(
  tags: string[]
): Promise<Commands['pageScript']['zendeskSetTags']['resp']> {
  const sidebarRuntime = getRuntime(
    (r) => r.location === 'ticket_sidebar' && r.isActive
  );

  if (!sidebarRuntime) {
    return failure('Must be logged in and on main Zendesk app');
  }
  const app = await getApp(sidebarRuntime);

  const response = await handleLocalRequest(sidebarRuntime, app, 'set', {
    'ticket.tags': tags,
  });

  if (!('ticket.tags' in response)) {
    const {
      errors: {
        'ticket.tags': { message },
      },
    } = response as any;
    return failure(message);
  }
  return success(response['ticket.tags'] as string[]);
}

export async function removeTags(
  tags: string[]
): Promise<Commands['pageScript']['zendeskRemoveTags']['resp']> {
  const sidebarRuntime = getRuntime(
    (r) => r.location === 'ticket_sidebar' && r.isActive
  );

  if (!sidebarRuntime) {
    return failure('Must be logged in and on main Zendesk app');
  }
  const app = await getApp(sidebarRuntime);

  const response = await handleLocalRequest(sidebarRuntime, app, 'invoke', {
    // This passes in the array of tags as the only item in an args array
    // e.g. [['tag1', 'tag2']]
    'ticket.tags.remove': [tags],
  });

  if (!('ticket.tags.remove' in response)) {
    const {
      errors: {
        'ticket.tags.remove': { message },
      },
    } = response as any;
    return failure(message);
  }
  return success(response['ticket.tags.remove'] as string[]);
}

export async function extractTags(): Promise<
  Commands['pageScript']['zendeskExtractTags']['resp']
> {
  const runtime = getRuntime((r) => r.location === 'background' && r.isActive);
  if (!runtime) {
    return failure({ message: 'Must be logged in and on main Zendesk app' });
  }
  const app = await getApp(runtime);
  let tags: { name: string; count: number }[] = [];
  const result = await getPaginated(app, '/api/v2/tags.json', (data) => {
    tags = tags.concat(data.tags);
  });
  if (isFailure(result)) {
    return failure({ message: result.error, partial: tags });
  }
  return success(tags);
}
