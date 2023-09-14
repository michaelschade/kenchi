import { BaseEditor, Editor, Element, Node, Text } from 'slate';
import { ReactEditor } from 'slate-react';

import {
  ListElement,
  ListItemElement,
  SlateElement,
  SlateNode,
  SlateText,
} from '@kenchi/slate-tools/lib/types';

// TODO: find a better place for this
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: SlateElement;
    Text: SlateText;
  }
}

export const isListItem = (n: Node): n is ListItemElement =>
  Element.isElement(n) &&
  (n.type === 'list-item' || n.type === 'collapsible-list-item');
export const isList = (n: Node): n is ListElement =>
  Element.isElement(n) &&
  (n.type === 'numbered-list' || n.type === 'bulleted-list');

// The things the void wrapper wraps
const VOID_WRAPPED = new Set(['workflow-embed', 'tool', 'image']);
export const isVoidWrapped = (n: SlateNode) =>
  n.type && VOID_WRAPPED.has(n.type);
export const isVoidElement = (n: Node) =>
  Element.isElement(n) && (n.type === 'void-spacer' || isVoidWrapped(n));

export function isEmptyRecursive(editor: Editor, element: Node): boolean {
  if (Text.isText(element)) {
    return element.text === '';
  }
  if (Element.isElement(element) && editor.isVoid(element)) {
    return false;
  }
  return element.children.every((n) => isEmptyRecursive(editor, n));
}
