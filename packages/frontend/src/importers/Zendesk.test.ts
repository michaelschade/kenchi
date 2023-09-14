import { success } from '@kenchi/shared/lib/Result';

import { ImportEntry } from '.';
import parse, { ZendeskAction, ZendeskRow } from './Zendesk';

const macroSkeleton = {
  id: 1500008825021,
  url: 'https://openphone.zendesk.com/api/v2/macros/1500008825021.json',
  title: 'Customer not responding',
  active: true,
  position: 12,
  created_at: '2021-03-22T23:35:54Z',
  updated_at: '2022-01-08T18:19:04Z',
  description: null,
  restriction: null,
};

const slateVariableNode = (
  id: string,
  placeholder: string,
  source: string
) => ({
  type: 'paragraph',
  children: [
    {
      children: [
        {
          text: '',
        },
      ],
      id,
      placeholder,
      source,
      type: 'variable',
    },
  ],
});
const createMacro = (overrides: {
  active?: boolean;
  actions: ZendeskAction[];
}): ZendeskRow => ({
  ...macroSkeleton,
  ...overrides,
});
const parseAction = (action: ZendeskAction): ImportEntry => {
  return parse([createMacro({ actions: [action] })])[0];
};

it('parses Zendesk actions into an action object', () => {
  const macro = createMacro({
    actions: [
      {
        field: 'comment_value',
        value: 'Hello support world!',
      },
      { field: 'current_tags', value: 'important high' },
      { field: 'status', value: 'solved' },
    ],
  });
  const importEntries = parse([macro]);
  expect(importEntries.length).toEqual(1);
  expect(importEntries[0]).toEqual({
    id: macro.id.toString(),
    name: macro.title,
    slate: success([
      { type: 'paragraph', children: [{ text: 'Hello support world!' }] },
    ]),
    zendeskTags: success({ tagsToAdd: ['important', 'high'] }),
    zendeskSetTicketStatus: success('solved'),
  });
});
it('filters out inactive entries', () => {
  const activeMacro = createMacro({
    active: true,
    actions: [
      {
        field: 'comment_value',
        value: 'I am active',
      },
    ],
  });
  const inactiveMacro = createMacro({
    active: false,
    actions: [
      {
        field: 'comment_value',
        value: 'I am INactive',
      },
    ],
  });
  const importEntries = parse([activeMacro, inactiveMacro]);
  expect(importEntries.length).toEqual(1);
  expect(importEntries[0]).toEqual({
    id: activeMacro.id.toString(),
    name: activeMacro.title,
    slate: success([
      { type: 'paragraph', children: [{ text: 'I am active' }] },
    ]),
  });
});
it('favors an html comment when there are both html and plaintext comments', () => {
  const macro = createMacro({
    actions: [
      {
        field: 'comment_value_html',
        value: '<p>Hello formatted world!</p>',
      },
      {
        field: 'comment_value',
        value: 'Hello support world!',
      },
    ],
  });
  const importEntries = parse([macro]);
  expect(importEntries[0]).toEqual({
    id: macro.id.toString(),
    name: macro.title,
    slate: success([
      { type: 'paragraph', children: [{ text: '' }] },
      { type: 'paragraph', children: [{ text: 'Hello formatted world!' }] },
      { type: 'paragraph', children: [{ text: '' }] },
    ]),
  });
});
it('creates an empty slate node for actions with no inserted text', () => {
  const macro = createMacro({
    actions: [
      { field: 'current_tags', value: 'important high' },
      { field: 'status', value: 'solved' },
    ],
  });
  const importEntries = parse([macro]);
  expect(importEntries.length).toEqual(1);
  expect(importEntries[0]).toEqual({
    id: macro.id.toString(),
    name: macro.title,
    slate: success([{ type: 'paragraph', children: [{ text: '' }] }]),
    zendeskTags: success({ tagsToAdd: ['important', 'high'] }),
    zendeskSetTicketStatus: success('solved'),
  });
});

describe('parsing actions', () => {
  it('parses adding a plaintext comment', () => {
    const parsedAction = parseAction({
      field: 'comment_value',
      value: 'Hello support world!',
    });
    expect(parsedAction.slate).toEqual(
      success([
        { type: 'paragraph', children: [{ text: 'Hello support world!' }] },
      ])
    );
  });
  it('parses adding an HTML comment', () => {
    const parsedAction = parseAction({
      field: 'comment_value_html',
      value: '<p>Hi!</p><p><br></p><p>Thank you for reaching out!</p>',
    });
    expect(parsedAction.slate).toEqual(
      success([
        { type: 'paragraph', children: [{ text: '' }] },
        { type: 'paragraph', children: [{ text: 'Hi!' }] },
        { type: 'paragraph', children: [{ text: '' }] },
        {
          type: 'paragraph',
          children: [{ text: 'Thank you for reaching out!' }],
        },
        { type: 'paragraph', children: [{ text: '' }] },
      ])
    );
  });

  it('translates known variable placeholders as page variables', () => {
    const parsedAction = parseAction({
      field: 'comment_value',
      value: `The list:<br>
      {{ticket.assignee.email}}<br>
      {{ticket.assignee.first_name}}<br>
      {{ticket.assignee.name}}<br>
      {{ticket.requester.email}}<br>
      {{ticket.requester.first_name}}<br>
      {{ticket.requester.name}}<br>
      {{current_user.email}}<br>
      {{current_user.first_name}}<br>
      {{current_user.name}}<br>`,
    });
    expect(parsedAction.slate).toEqual(
      success([
        { type: 'paragraph', children: [{ text: 'The list:' }] },
        slateVariableNode('authorEmail', 'Author email', 'page'),
        slateVariableNode('authorFirstName', 'Author first name', 'page'),
        slateVariableNode('authorName', 'Author name', 'page'),
        slateVariableNode('recipientEmail', 'Recipient email', 'page'),
        slateVariableNode('recipientFirstName', 'Recipient first name', 'page'),
        slateVariableNode('recipientName', 'Recipient name', 'page'),
        slateVariableNode('authorEmail', 'Author email', 'page'),
        slateVariableNode('authorFirstName', 'Author first name', 'page'),
        slateVariableNode('authorName', 'Author name', 'page'),
      ])
    );
  });

  it('translates unknown variable placeholders as input variables', () => {
    const parsedAction = parseAction({
      field: 'comment_value',
      // This list is not exhaustive
      value: `The unknown list:<br>
      {{ticket.title}}<br>
      {{ticket.url}}<br>
      {{ticket.assignee.last_name}}<br>
      {{ticket.requester.phone}}<br>
      {{ticket.requester.last_name}}<br>
      {{current_user.phone}}<br>`,
    });
    expect(parsedAction.slate).toEqual(
      success([
        { type: 'paragraph', children: [{ text: 'The unknown list:' }] },
        slateVariableNode('ticket.title', 'ticket.title', 'input'),
        slateVariableNode('ticket.url', 'ticket.url', 'input'),
        slateVariableNode(
          'ticket.assignee.last_name',
          'ticket.assignee.last_name',
          'input'
        ),
        slateVariableNode(
          'ticket.requester.phone',
          'ticket.requester.phone',
          'input'
        ),
        slateVariableNode(
          'ticket.requester.last_name',
          'ticket.requester.last_name',
          'input'
        ),
        slateVariableNode('current_user.phone', 'current_user.phone', 'input'),
      ])
    );
  });

  it('parses setting ticket status', () => {
    const parsedAction = parseAction({
      field: 'status',
      value: 'pending',
    });
    expect(parsedAction.zendeskSetTicketStatus).toEqual(success('pending'));
  });
  it('parses adding tags', () => {
    const parsedAction = parseAction({
      field: 'current_tags',
      value: 'meow woof moo',
    });
    expect(parsedAction.zendeskTags).toEqual(
      success({
        tagsToAdd: ['meow', 'woof', 'moo'],
      })
    );
  });
  it('parses setting tags', () => {
    const parsedAction = parseAction({
      field: 'set_tags',
      value: 'meow woof moo',
    });
    expect(parsedAction.zendeskTags).toEqual(
      success({
        tagsToSet: ['meow', 'woof', 'moo'],
      })
    );
  });
  it('parses removing tags', () => {
    const parsedAction = parseAction({
      field: 'remove_tags',
      value: 'meow woof moo',
    });
    expect(parsedAction.zendeskTags).toEqual(
      success({
        tagsToRemove: ['meow', 'woof', 'moo'],
      })
    );
  });
  it('parses assigning the current user', () => {
    const parsedAction = parseAction({
      field: 'assignee_id',
      value: 'current_user',
    });
    expect(parsedAction.zendeskAssign).toEqual(success({ userId: 'self' }));
  });
});
