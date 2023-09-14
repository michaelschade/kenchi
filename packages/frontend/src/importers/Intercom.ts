import Result, { failure, success } from '@kenchi/shared/lib/Result';
import { fromHTML } from '@kenchi/slate-tools/lib/fromHTML';
import { SlateNode, SlateText } from '@kenchi/slate-tools/lib/types';

import { ImportEntry } from '.';

type TextBlock = {
  type: 'paragraph' | 'heading' | 'subheading' | 'code';
  text: string;
};

type ImageBlock = {
  type: 'image';
  url: string;
  width: number;
  height: number;
  linkUrl: string;
};

type ListBlock = {
  type: 'orderedList' | 'unorderedList';
  items: string[];
};

type MessengerCardComponentItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  action: { type: string; url: string };
};

type MessengerCardComponent = {
  type: string;
  items: MessengerCardComponentItem[];
};

type MessengerCardBlock = {
  type: 'messengerCard';
  text: string;
  // Lots of fields, but we only use a few
  canvas: {
    content: {
      components: MessengerCardComponent[];
    };
  };
};

type AttachmentListBlock = {
  type: 'attachmentList';
  attachments: {
    id: number;
    url: string;
    name: string;
    size: number;
    contentType: string;
  }[];
};

type Block =
  | TextBlock
  | ImageBlock
  | ListBlock
  | MessengerCardBlock
  | AttachmentListBlock
  | { type: 'unknown' }; // Magic type to cover the rest we don't know about

type IntercomRow = {
  id: string;
  // "admin_id": "2998232",
  // "app_id": "rfkpz7va",
  // "created_at": "2019-06-18T20:03:50.000Z",
  blocks: Block[];
  // "summary": "Hi there , Yes. We offer a 7-day free trial. You'll only get charged on the 8th day. You can sign up and start the trial here ⤴️ We want to let people try the OpenPhone app first before making the buying decision. 😃 If you think that the app suits your current needs, you can continue with the subscr",
  name: string;
  actions: Record<string, unknown>[];
  // "updated_at": "2020-12-11T00:10:35.000Z",
  // "actions": "<ember2.FragmentArray:ember2113:owner(1201517)>"
};

function addShallowTextStyle(
  node: SlateNode,
  style: Omit<SlateText, 'text'>
): SlateNode {
  const stylify = (node: SlateText): SlateText => ({ ...node, ...style });
  if (node.text) {
    return stylify(node);
  } else if (node.children) {
    return {
      ...node,
      children: node.children.map((n) => (n.text ? stylify(n) : n)),
    };
  } else {
    return node;
  }
}

function convertBlock(block: Block): SlateNode[] {
  switch (block.type) {
    case 'paragraph':
      return [
        ...convertText(block.text),
        { type: 'paragraph', children: [{ text: '' }] },
      ];
    case 'image':
      return [
        {
          type: 'image',
          url: block.url,
          href: block.linkUrl === block.url ? undefined : block.linkUrl,
          children: [{ text: '' }],
        },
      ];
    case 'heading':
      return convertText(block.text, { wrappingTag: 'h1', splitOnBr: false });
    case 'subheading':
      return convertText(block.text).map((n) =>
        addShallowTextStyle(n, { bold: true })
      );
    case 'code':
      return convertText(block.text).map((n) =>
        addShallowTextStyle(n, { code: true })
      );
    case 'orderedList':
    case 'unorderedList':
      return [
        {
          type:
            block.type === 'orderedList' ? 'numbered-list' : 'bulleted-list',
          children: block.items.map((html) => ({
            type: 'list-item',
            children: convertText(html),
          })),
        },
      ];
    case 'messengerCard':
      return convertMessengerCard(block);
    case 'attachmentList':
      return convertAttachmentList(block);
    default:
      throw new ParseError(`Unrecognized block type: ${block.type}`);
  }
}

function getVariable(key: string) {
  const pageMap: Record<string, { id: string; placeholder: string }> = {
    first_name: {
      id: 'recipientFirstName',
      placeholder: 'Recipient first name',
    },
    'message.author.first_name': {
      id: 'authorFirstName',
      placeholder: 'Author first name',
    },
  };
  if (key in pageMap) {
    const variable = pageMap[key];
    return `<variable id="${variable.id}" source="page" placeholder="${variable.placeholder}"></variable>`;
  } else {
    return `<variable id="${key}" source="input" placeholder="${key}"></variable>`;
  }
}

function convertText(
  html: string,
  { wrappingTag = 'p', splitOnBr = true } = {}
): SlateNode[] {
  // Rewrite {{variable}} to XML <variable> tag to more easily extract below
  html = html.replaceAll(
    /{{([A-Za-z0-9._]*)(\s*\|\s*fallback:\s*"[^"]*")?}}/g,
    (_match, key, _fallback) => getVariable(key)
  );
  const body = new DOMParser().parseFromString(
    `<${wrappingTag}>${html}</${wrappingTag}>`,
    'text/html'
  ).body;
  const slate = fromHTML(body, {
    splitOnBr,
    onImage: () => false,
  });
  return slate;
}

function convertMessengerCard(block: MessengerCardBlock): SlateNode[] {
  // It seems that messenger cards can contain multiple items. In our
  // experience, it's messenger card -> list -> item -> sheet, which links to an
  // article. We've only seen one at a time, so only handle that basic case.

  const components = block.canvas.content.components;
  if (components.length !== 1) {
    throw new ParseError(
      `Our importer only expects messenger cards with 1 component, but card ${block.text} has ${components.length} components`
    );
  }
  const items = components[0].items;
  if (items.length !== 1) {
    throw new ParseError(
      `Our importer only expects messenger components with 1 item, but card ${block.text} has ${items.length} items`
    );
  }

  const item = items[0];
  if (item.id !== 'article-link') {
    throw new ParseError(
      `Our importer only expects messenger cards that contain article links, but card ${block.text} has a "${item.id}" item`
    );
  }

  return [
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: item.action.url,
          children: [{ text: item.title }],
        },
      ],
    },
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ];
}

function convertAttachmentList(block: AttachmentListBlock): SlateNode[] {
  return block.attachments.map((attachment) => ({
    type: 'paragraph',
    children: [
      {
        type: 'link',
        url: attachment.url,
        children: [{ text: attachment.name }],
      },
    ],
  }));
}

class ParseError extends Error {}

function parseBlocks(blocks: Block[]): Result<SlateNode[], string> {
  try {
    const nodes = blocks.flatMap(convertBlock);
    return success(nodes);
  } catch (e) {
    if (e instanceof ParseError) {
      return failure(e.message);
    } else {
      throw e;
    }
  }
}

function parseTags(
  actions: Record<string, unknown>[]
): Result<string[], string> {
  const tagActions = actions.filter((a) => {
    return a.type === 'add-tag-to-conversation';
  });
  let tags: string[];
  try {
    tags = tagActions.map((a) => {
      if (
        a.actionData &&
        typeof a.actionData === 'object' &&
        'tag_id' in a.actionData
      ) {
        // @ts-ignore
        return a.actionData.tag_id;
      }
      throw new Error('Tag action does not match expected format');
    });
  } catch (e) {
    if (e instanceof Error) {
      return failure(e.message);
    } else {
      throw e;
    }
  }
  return success(tags);
}

export default function parse(input: IntercomRow[]): ImportEntry[] {
  return input.map((row) => ({
    id: row.id,
    name: row.name,
    slate: parseBlocks(row.blocks),
    intercomTags: parseTags(row.actions),
  }));
}
