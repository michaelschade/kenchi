import { Editor, Element, Point, Range, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';

import { SlateElement } from '@kenchi/slate-tools/lib/types';

import { LIST_TYPES } from './constants';
import { isListItem } from './utils';

const SHORTCUTS: Record<string, 'bulleted-list' | 'numbered-list' | 'heading'> =
  {
    '*': 'bulleted-list',
    '-': 'bulleted-list',
    '+': 'bulleted-list',
    '1.': 'numbered-list',
    '#': 'heading',
  };

const modifyText = (editor: Editor) => {
  const { selection } = editor;
  if (!selection) {
    return;
  }
  const { anchor } = selection;
  const block = Editor.above(editor, {
    match: (n) => Editor.isBlock(editor, n),
  });
  const path = block ? block[1] : [];
  const start = Editor.start(editor, path);
  const range = { anchor, focus: start };
  const beforeText = Editor.string(editor, range);
  const type = SHORTCUTS[beforeText];

  Editor.withoutNormalizing(editor, () => {
    Transforms.delete(editor, { at: range });
    Transforms.setNodes(
      editor,
      { type: LIST_TYPES.includes(type) ? 'list-item' : type },
      { at: range }
    );

    if (LIST_TYPES.includes(type)) {
      const list: SlateElement = { type, children: [] };
      Transforms.wrapNodes(editor, list, { at: range });
    }
  });
};

export default function withShortcuts(editor: ReactEditor) {
  const { deleteBackward, insertText } = editor;

  editor.insertText = (text) => {
    const { selection } = editor;

    if (text === ' ' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const block = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      });
      const path = block ? block[1] : [];
      const start = Editor.start(editor, path);
      const range = { anchor, focus: start };
      const beforeText = Editor.string(editor, range);
      const type = SHORTCUTS[beforeText];

      if (type) {
        modifyText(editor);
        return;
      }
    }

    insertText(text);
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      });

      if (match) {
        const [block, path] = match;
        const start = Editor.start(editor, path);

        if (
          Element.isElement(block) &&
          block.type !== 'paragraph' &&
          !editor.isVoid(block) &&
          Point.equals(selection.anchor, start)
        ) {
          Transforms.setNodes(editor, { type: 'paragraph' });

          if (isListItem(block)) {
            Transforms.liftNodes(editor, { at: path });
          }

          return;
        }
      }

      deleteBackward(...args);
    }
  };

  return editor;
}
