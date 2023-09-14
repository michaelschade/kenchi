import { sanitizeUrl } from '@braintree/sanitize-url';

import { SlateNode } from './types';

type DeserializeOpts = {
  splitOnBr: boolean;
  onImage: (src: string) => boolean;
  doubleParagraphs?: boolean;
};
export const fromHTML = (
  node: Node,
  opts: DeserializeOpts,
  textAttributes: Record<string, boolean> = {},
  parent?: Node | undefined
): SlateNode[] => {
  if (node.nodeType === 3 && node.textContent) {
    if (node.textContent.trim() === '') {
      return [];
    }
    // Normally textContent will not have newlines. Copying from inside a
    // multi-line Google Sheets cell does though. Make newlines their own paragraphs.
    return node.textContent
      .split('\n')
      .map((text) => ({ ...textAttributes, text }));
  } else if (node.nodeType !== 1) {
    return [{ text: '' }];
  } else if (node.nodeName === 'BR') {
    if (parent && parent.nodeName !== 'BODY') {
      // TODO: Ignore deep-down linebreaks for now
      return [];
    } else {
      return [{ type: 'paragraph', children: [{ text: '' }] }];
    }
  }

  // Remaining type is element, but no way in code to get that to check without
  // checking `instanceof Element`, which doesn't exist on backend
  const el = node as Element;

  const newTextAttributes = { ...textAttributes };
  const style = el.getAttribute('style');
  switch (el.nodeName) {
    case 'PRE':
    case 'CODE':
      newTextAttributes.code = true;
      break;
    case 'EM':
    case 'I':
      newTextAttributes.italic = true;
      break;
    case 'STRONG':
    case 'B':
      // GDocs wraps the whole body in <b style="font-weight:normal;" id="docs-internal-guid-SOMEUUID">
      if (!style || !style.match(/font-weight:\s*normal/)) {
        newTextAttributes.bold = true;
      }
      break;
    case 'U':
      newTextAttributes.underline = true;
      break;
    case 'SPAN':
      if (!style) {
        break;
      }
      // GDocs uses styles on spans
      if (style.match(/font-style:\s*italic/)) {
        newTextAttributes.italic = true;
      }
      const fontWeight = style.match(/font-weight:\s*(\d+)/);
      if (fontWeight && parseInt(fontWeight[1]) > 600) {
        newTextAttributes.bold = true;
      }
      if (style.match(/text-decoration:\s*underline/)) {
        newTextAttributes.underline = true;
      }
      break;
  }

  const deserializeItem = (n: ChildNode) =>
    fromHTML(n, opts, newTextAttributes, el);

  const childNodes = Array.from(el.childNodes);
  if (opts.splitOnBr) {
    const hasBr = childNodes.some((n) => n.nodeName === 'BR');
    if (hasBr) {
      const rtn: SlateNode[] = [];
      let lastBr = 0;
      for (var i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeName === 'BR') {
          rtn.push({
            type: 'paragraph',
            children: childNodes.slice(lastBr, i).flatMap(deserializeItem),
          });
          lastBr = i;
        }
      }
      rtn.push({
        type: 'paragraph',
        children: childNodes.slice(lastBr + 1).flatMap(deserializeItem),
      });
      rtn.forEach(
        (n) => n.children?.length === 0 && n.children.push({ text: '' })
      );
      return rtn;
    }
  }

  const children = childNodes.flatMap(deserializeItem);

  if (children.length === 0) {
    children.push({ text: '' });
  }

  switch (el.nodeName) {
    case 'H1':
    case 'H2':
    case 'H3':
      return [{ type: 'heading', children }];
    case 'A':
      let href = el.getAttribute('href');
      if (href && href !== '#') {
        href = sanitizeUrl(href);
        if (href !== 'about:blank') {
          return [{ type: 'link', url: href, children }];
        }
      }
      return children;
    case 'IMG':
      let src = el.getAttribute('src');
      if (src) {
        src = sanitizeUrl(src);
        if (src !== 'about:blank') {
          const uploading = opts.onImage(src);
          return [{ type: 'image', uploading, url: src, children }];
        }
      }
      break;
    case 'LI':
      return [{ type: 'list-item', children }];
    case 'OL':
      return [{ type: 'numbered-list', children }];
    case 'UL':
      return [{ type: 'bulleted-list', children }];
    case 'PRE':
    case 'P':
      if (parent && opts.doubleParagraphs) {
        // Not exactly correct since we do it at the top level only and it adds
        // an extra new paragraph to the end, but good enough for now.
        // Fix for https://app.asana.com/0/1199363646185872/1200209526720691
        return [
          { type: 'paragraph', children },
          { type: 'paragraph', children: [{ text: '' }] },
        ];
      } else {
        return [{ type: 'paragraph', children }];
      }
    // Specifically necessary for gmail: treat top-level divs and spans as paragraphs
    case 'DIV':
    case 'SPAN':
      if (!parent || parent.nodeName === 'BODY') {
        // If we're pasting into a document that does not require
        // double-paragraphs for newlines (i.e. playbooks, i.e. things where
        // paragraphs have spacing at the end of them), ignore the empty divs.
        // This is technically wrong as it'll collapse multiple line breaks into
        // a single space, but it's more commonly what one would want.
        if (
          !opts.doubleParagraphs &&
          children.length === 1 &&
          children[0].text === ''
        ) {
          return [];
        } else {
          return [{ type: 'paragraph', children }];
        }
      }
      break;
    // These are conveniences for importers
    case 'TOOL':
      return [
        {
          type: 'tool',
          tool: el.getAttribute('tool')!,
          children,
        },
      ];
    case 'VARIABLE':
      return [
        {
          type: 'variable',
          id: el.id,
          source: el.getAttribute('source') as any,
          placeholder: el.getAttribute('placeholder')!,
          children,
        },
      ];
  }

  return children;
};
