import { assign, groupBy } from 'lodash';

import Result, { failure, success } from '@kenchi/shared/lib/Result';
import { fromHTML } from '@kenchi/slate-tools/lib/fromHTML';
import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { ZendeskTagsConfig } from '../tool/edit/AppActions/ZendeskTagsConfigurator';
import { ImportEntry, ImportEntryAction } from '.';

export type ZendeskAction = { field: string; value: string };

export type ZendeskRow = {
  id: number;
  url: string;
  title: string;
  active: boolean;
  actions: ZendeskAction[];
  position: number;
  created_at: string;
  updated_at: string;
  description: string | null;
  restriction: Object | null;
};

const FIELD_MAPPING: Readonly<Record<string, string>> = {
  comment_value: 'slate',
  comment_value_html: 'slate',
  current_tags: 'zendeskTags',
  set_tags: 'zendeskTags',
  remove_tags: 'zendeskTags',
  assignee_id: 'zendeskAssign',
  status: 'zendeskSetTicketStatus',
};

function getVariable(key: string) {
  const pageMap: Record<string, { id: string; placeholder: string }> = {
    '{{ticket.requester.first_name}}': {
      id: 'recipientFirstName',
      placeholder: 'Recipient first name',
    },
    '{{ticket.requester.name}}': {
      id: 'recipientName',
      placeholder: 'Recipient name',
    },
    '{{ticket.requester.email}}': {
      id: 'recipientEmail',
      placeholder: 'Recipient email',
    },
    '{{current_user.first_name}}': {
      id: 'authorFirstName',
      placeholder: 'Author first name',
    },
    '{{current_user.name}}': {
      id: 'authorName',
      placeholder: 'Author name',
    },
    '{{current_user.email}}': {
      id: 'authorEmail',
      placeholder: 'Author email',
    },
    '{{ticket.assignee.first_name}}': {
      id: 'authorFirstName',
      placeholder: 'Author first name',
    },
    '{{ticket.assignee.name}}': {
      id: 'authorName',
      placeholder: 'Author name',
    },
    '{{ticket.assignee.email}}': {
      id: 'authorEmail',
      placeholder: 'Author email',
    },
  };
  if (key in pageMap) {
    const variable = pageMap[key];
    return `<variable id="${variable.id}" source="page" placeholder="${variable.placeholder}"></variable>`;
  } else {
    const name = key.substring(2, key.length - 2);
    return `<variable id="${name}" source="input" placeholder="${name}"></variable>`;
  }
}

function parseActions(actions: ZendeskAction[]): ImportEntryAction {
  const groupedActions = groupBy(
    actions,
    (action) => FIELD_MAPPING[action.field]
  );
  const textInsertAction =
    groupedActions.slate?.find((a) => a.field === 'comment_value_html') ??
    groupedActions.slate?.find((a) => a.field === 'comment_value');
  const slate: Result<SlateNode[], string> = textInsertAction
    ? parseCommentValue(textInsertAction.value)
    : success([{ type: 'paragraph', children: [{ text: '' }] }]);
  const tags =
    groupedActions.zendeskTags?.length > 0
      ? { zendeskTags: parseTagActions(groupedActions.zendeskTags) }
      : undefined;
  const ticketStatus = groupedActions.zendeskSetTicketStatus
    ? {
        zendeskSetTicketStatus: success(
          groupedActions.zendeskSetTicketStatus[0].value
        ),
      }
    : undefined;
  const zendeskAssign =
    groupedActions.zendeskAssign?.[0].value === 'current_user'
      ? { zendeskAssign: success({ userId: 'self' as const }) }
      : undefined;
  return {
    slate,
    ...tags,
    ...ticketStatus,
    ...zendeskAssign,
  };
}
function parseCommentValue(value: string): Result<SlateNode[], string> {
  let html = value
    .split('\n')
    .map((line) => `<p>${line}</p>`)
    .join('');
  html = html.replaceAll(/{{[a-z_]+\.[a-z_.]+}}/g, getVariable);

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return success(
    fromHTML(parsed.body, {
      splitOnBr: false,
      onImage: () => false,
    })
  );
}

function parseTagActions(
  actions: ZendeskAction[]
): Result<ZendeskTagsConfig, string> {
  try {
    const zendeskTags: ZendeskTagsConfig = assign(
      {},
      ...actions.map((action) => {
        switch (action.field) {
          case 'current_tags':
            return { tagsToAdd: action.value.split(/\s+/) };
          case 'set_tags':
            return { tagsToSet: action.value.split(/\s+/) };
          case 'remove_tags':
            return { tagsToRemove: action.value.split(/\s+/) };
        }
        throw new Error(
          `Attempted to parse a tag action with unknown field: ${action.field}`
        );
      })
    );

    return success(zendeskTags);
  } catch (e: any) {
    return failure(e.message);
  }
}

export default function parse(input: ZendeskRow[]): ImportEntry[] {
  return input
    .filter((row) => row.active)
    .map((row) => ({
      id: `${row.id}`,
      name: row.title,
      ...parseActions(row.actions),
    }));
}
