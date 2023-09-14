import * as txml from 'txml';

import Result, { failure, success } from '@kenchi/shared/lib/Result';
import { fromHTML } from '@kenchi/slate-tools/lib/fromHTML';
import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { ImportEntry } from '.';

type TERawSnippet = {
  abbreviation: string;
  abbreviationMode: string;
  creationDate: string;
  label: string;
  modificationDate: string;
  snippetType: string;
  uuidString: string;
  htmlText?: string;
  plainText?: string;
  extraInfo?: {
    jsonStr?: string;
  };
};

type TENode =
  | TENodeBR
  | TENodeParagraph
  | TENodeLink
  | TENodeText
  | TENodeList
  | TENodeListItem
  | TENodeImage;

type TENodeBR = {
  __typename: 'TENodeBR';
};

type TENodeParagraph = {
  __typename: 'TENodeParagraph';
  nodes: TENode[];
};

type TENodeLink = {
  __typename: 'TENodeLink';
  href: string;
  nodes?: TENode[];
};

type TENodeText = {
  __typename: 'TENodeText';
  contents: string;
};

type TENodeList = {
  __typename: 'TENodeList';
  type: 'ordered' | 'unordered';
  nodes: TENode[];
};

type TENodeListItem = {
  __typename: 'TENodeListItem';
  nodes: TENode[];
};

type TENodeImage = {
  __typename: 'TENodeImage';
  // TODO: fix
  src?: string;
  width?: number;
  height?: number;
};

// TODO: variables

// Transform a parsed TE node into HTML for ingestion by our editor
const teNodeToHTML = (node: TENode): string => {
  const recur = (nodes?: TENode[]) => nodes?.map(teNodeToHTML).join('') || '';
  switch (node.__typename) {
    case 'TENodeParagraph':
      return `<p>${recur(node.nodes)}</p>`;
    case 'TENodeText':
      // trim that also removes zero-width space and similar invisible characters
      if (node.contents.replace(/(^[\s\u200b]*|[\s\u200b]*$)/g, '') === '') {
        return '';
      }
      return `${node.contents}`;
    case 'TENodeLink':
      return `<a href ="${node.href}">${recur(node.nodes)}</a>`;
    case 'TENodeList':
      const tag = node.type === 'ordered' ? 'ol' : 'ul';
      return `<${tag}>${recur(node.nodes)}</${tag}>`;
    case 'TENodeListItem':
      return `<li>${recur(node.nodes)}</li>`;
    case 'TENodeImage':
      // TODO: implement image
      return `<img src=${node.src} height=${node.height} width=${node.width} />`;
    case 'TENodeBR':
      return `<br />`;
  }
};

class ParseError extends Error {}

const teParseRawNode = (node: any): TENode => {
  switch (node.e) {
    case 'tx':
      return {
        __typename: 'TENodeText',
        contents: node.tx,
      };
    case 'link':
      return {
        __typename: 'TENodeLink',
        href: node.href,
        nodes: node.nodes?.map(teParseRawNode),
      };
    case 'br':
      return {
        __typename: 'TENodeBR',
      };
    case 'unordered-list':
    case 'numbered-list':
      return {
        __typename: 'TENodeList',
        type: node.e === 'numbered-list' ? 'ordered' : 'unordered',
        nodes: node['list-items']?.map(teParseRawNode),
      };
    case 'list-item':
      return {
        __typename: 'TENodeListItem',
        nodes: node.nodes?.map(teParseRawNode),
      };
    case 'image':
      return {
        __typename: 'TENodeImage',
        src: node.src,
        width: node.width,
        height: node.height,
      };
    default:
      throw new ParseError(`Unknown field: ${node.e}`);
  }
};

const teNormalizeNodes = (nodes: TENode[]) => {
  // TextExpander just gives us text nodes, so we need to infer paragraphs
  // ourselves. We'll keep appending to the same <p> until we encounter our
  // first <br />, which we'll treat as an end of paragraph in addition to
  // linebreak. The next non-BR will open a new para.
  //
  // This doesn't handle single line breaks at all, since any <br /> is a new
  // paragraph, but I think failing open this way is the right default for now.
  // We should revisit how we want to handle single line breaks vs. paragraphs.
  //
  // TODO: Revisit this norm ^
  // TODO: should slate-tools fromHTML be handling this for us?
  let normalized: TENode[] = [];
  let paragraph: TENodeParagraph = { __typename: 'TENodeParagraph', nodes: [] };
  nodes.forEach((node) => {
    if (paragraph.nodes.length > 0 && node.__typename === 'TENodeBR') {
      normalized.push(paragraph);
      paragraph = { __typename: 'TENodeParagraph', nodes: [] };
    } else if (node.__typename !== 'TENodeBR') {
      paragraph.nodes.push(node);
    } else {
      normalized.push(node);
    }
  });
  if (paragraph.nodes.length > 0) {
    normalized.push(paragraph);
  }
  return normalized;
};

// Parse a raw snippet (1:1 with the XML) into an import-ready TESnippet
const teParseRawSnippet = (snippet: TERawSnippet): ImportEntry => {
  let html;
  let error;
  if (snippet.extraInfo?.jsonStr) {
    const json = JSON.parse(snippet.extraInfo.jsonStr || '');
    try {
      const nodes = teNormalizeNodes(json['nodes'].map(teParseRawNode));
      html = nodes.map(teNodeToHTML).join('');
    } catch (e) {
      if (e instanceof ParseError) {
        error = e.message;
      } else {
        throw e;
      }
    }
  } else if (snippet.htmlText) {
    const parsed = new DOMParser().parseFromString(
      snippet.htmlText || '',
      'text/html'
    );
    html = parsed.documentElement.textContent || '';
  } else {
    const text = snippet.plainText || '';
    html = '<p>' + text.split('\n').join('</p><p>') + '</p>';
  }
  // Labels can also include HTML entities, so we'll decode them safely
  const parsedLabel = new DOMParser().parseFromString(
    snippet.label || '',
    'text/html'
  );

  let slate: Result<SlateNode[], string>;
  if (html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    slate = success(
      fromHTML(parsed.body, { splitOnBr: false, onImage: () => false })
    );
  } else {
    slate = failure(error || 'Error parsing import');
  }

  return {
    id: snippet.uuidString,
    shortcut: snippet.abbreviation,
    name: parsedLabel.documentElement.textContent || snippet.abbreviation,
    slate,
  };
};

// Parse a full .textexpander file into TESnippet objects
export default function parse(xmlText: string) {
  const xml = txml.parse(xmlText);
  // Deep search into TextExpander to find any nodes that contains a TextExpander shortcut
  const data = txml.filter(xml, (node: any) => {
    return node.children?.some((c: any) => c.children?.[0] === 'uuidString');
  });
  return data
    .map((d) => objectFromKV(d.children) as TERawSnippet)
    .map(teParseRawSnippet);
}

// Recursively transform an array of [key1, value1, key2, ...] pairs into an
// object. This reaches into TextExpander's `children` format as needed.
const objectFromKV = (arr: any[]) => {
  const entry: { [key: string]: any } = {};
  if (!arr) {
    return;
  }
  for (let i = 0; i < arr.length; i += 2) {
    const [key, value] = [arr[i].children?.[0], arr[i + 1].children];
    if (value?.length > 1 && value.length % 2 === 0) {
      entry[key] = objectFromKV(value);
    } else {
      entry[key] = value?.[0];
    }
  }
  return entry;
};
