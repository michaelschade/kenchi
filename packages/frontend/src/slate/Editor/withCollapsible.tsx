import { faArrowToTop } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Ancestor,
  Editor,
  Node,
  NodeMatch,
  Path,
  Range,
  Transforms,
} from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import {
  CollapsibleElement,
  CollapsibleListItemElement,
  SlateElement,
} from '@kenchi/slate-tools/lib/types';

import { randomString } from '../../utils';
import { Button } from './Toolbar';
import { isList, isListItem } from './utils';

const isAnyCollapsible = (
  n: Node
): n is CollapsibleElement | CollapsibleListItemElement =>
  isCollapsible(n) || isCollapsibleListItem(n);

export const isCollapsibleListItem = (
  n: Node
): n is CollapsibleListItemElement =>
  'type' in n && n.type === 'collapsible-list-item';

const isCollapsible = (n: Node): n is CollapsibleElement =>
  'type' in n && n.type === 'collapsible';

export default function withCollapsible(editor: ReactEditor) {
  const { deleteBackward, normalizeNode, insertBreak } = editor;

  editor.deleteBackward = (unit) => {
    const collapsibleEntry = Editor.above(editor, { match: isCollapsible });
    if (
      collapsibleEntry &&
      editor.selection &&
      Range.isCollapsed(editor.selection)
    ) {
      const [, collapsiblePath] = collapsibleEntry;
      const point = editor.selection.anchor;
      if (
        point.offset === 0 &&
        Path.isAncestor(collapsiblePath, point.path) &&
        point.path[collapsiblePath.length] === 0
      ) {
        Transforms.unwrapNodes(editor, { match: isCollapsible });
        return;
      }
    }

    return deleteBackward(unit);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (isAnyCollapsible(node)) {
      if (node.children.length === 1) {
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [] },
          { at: [...path, 1] }
        );
        return;
      }
      // Make sure there's something below the collapsible so you're not stuck inside of it.
      if (path.length === 1 && editor.children.length === path[0] + 1) {
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [] },
          { at: [editor.children.length] }
        );
        return;
      }

      // If someone put a list inside the header, instead convert to a collapsible list item.
      if (isList(node.children[0])) {
        Transforms.setNodes(
          editor,
          { type: 'collapsible-list-item', children: [] },
          { at: path }
        );
        Transforms.unwrapNodes(editor, { at: [...path, 0, 0] });
        Transforms.unwrapNodes(editor, { at: [...path, 0] });
      }
    }
    return normalizeNode(entry);
  };

  editor.insertBreak = () => {
    insertBreak();
    if (
      editor.selection &&
      Range.isCollapsed(editor.selection) &&
      isOrHasAncestor(editor, isCollapsibleListItem)
    ) {
      Transforms.setNodes<SlateElement>(
        editor,
        { type: 'list-item' },
        { match: isCollapsibleListItem }
      );
    }
  };

  return editor;
}

function isOrHasAncestor(editor: ReactEditor, match: NodeMatch<Ancestor>) {
  if (!editor.selection) {
    return false;
  }
  const path = Editor.path(editor, editor.selection);
  const node = Node.get(editor, path);
  if (match(node, path)) {
    return true;
  }
  return !!Editor.above(editor, { match });
}

function getCommonNode(editor: ReactEditor, at: Range) {
  const start = Editor.start(editor, at);
  const end = Editor.end(editor, at);
  const commonPath = Path.common(start.path, end.path);
  const [commonNode] = Editor.node(editor, commonPath);
  return commonNode;
}

function allChildrenAreCollapsible(editor: ReactEditor) {
  if (!editor.selection) {
    return false;
  }
  const commonNode = getCommonNode(editor, editor.selection);
  return isList(commonNode) && commonNode.children.every(isCollapsibleListItem);
}

// Make toggling return to original state: remove empty paragraph that was inserted if it's there.
function maybeRemoveEmptyParagraph(editor: ReactEditor) {
  if (!editor.selection) {
    return;
  }
  // const node = Node.get(editor, path);
  const collapsibleEntry = Editor.above(editor, {
    match: (n) => isCollapsible(n) || isCollapsibleListItem(n),
  });
  if (!collapsibleEntry) {
    return;
  }
  const [collapsibleNode, collapsiblePath] = collapsibleEntry;
  const path = Editor.path(editor, editor.selection);
  if (
    path[collapsiblePath.length] === 0 &&
    collapsibleNode.children.length === 2 &&
    collapsibleNode.children[1].children?.[0].text === ''
  ) {
    Transforms.removeNodes(editor, { at: [...collapsiblePath, 1] });
  }
}

export function toggleActive(editor: ReactEditor) {
  const selection = editor.selection;
  if (!selection) {
    return;
  }

  Editor.withoutNormalizing(editor, () => {
    if (isOrHasAncestor(editor, isCollapsible)) {
      maybeRemoveEmptyParagraph(editor);
      Transforms.unwrapNodes(editor, { match: isCollapsible });
    } else if (isOrHasAncestor(editor, isCollapsibleListItem)) {
      maybeRemoveEmptyParagraph(editor);
      Transforms.setNodes(
        editor,
        // @ts-ignore we want to unset the id
        { type: 'list-item', id: null },
        { match: isCollapsibleListItem }
      );
    } else if (isOrHasAncestor(editor, isListItem)) {
      Transforms.setNodes<SlateElement>(
        editor,
        // This is safe because we know we're only converting a single item
        { type: 'collapsible-list-item', id: randomString(10) },
        { match: isListItem }
      );
    } else {
      // We need to check if we're selecting across multiple list items so we can
      // indent into them
      const commonNode = getCommonNode(editor, selection);
      if (isList(commonNode)) {
        if (commonNode.children.every(isCollapsibleListItem)) {
          Transforms.setNodes(
            editor,
            // @ts-ignore we want to unset the id
            { type: 'list-item', id: null },
            { match: isListItem }
          );
        } else {
          Transforms.wrapNodes(
            editor,
            { type: 'bulleted-list', children: [] },
            { match: isListItem }
          );
          Transforms.wrapNodes(
            editor,
            {
              type: 'collapsible-list-item',
              id: randomString(10),
              children: [],
            },
            { match: isList }
          );
          const [, insertionPoint] = Editor.above(editor, {
            match: isCollapsibleListItem,
          })!;
          Transforms.insertNodes(
            editor,
            {
              type: 'paragraph',
              children: [{ text: '' }],
            },
            // at needs to be a point for match to work
            { at: [...insertionPoint, 0], select: true }
          );
        }
      } else {
        Transforms.wrapNodes(
          editor,
          { type: 'collapsible', id: randomString(10), children: [] },
          { mode: 'highest' }
        );
      }
    }
  });
}

export function Toolbar({ size }: { size: 'small' | 'large' }) {
  const editor = useSlate();
  return (
    <Button
      tooltip="Make collapsible"
      active={
        isOrHasAncestor(editor, isAnyCollapsible) ||
        allChildrenAreCollapsible(editor)
      }
      onMouseDown={(event) => {
        event.preventDefault();
        toggleActive(editor);
      }}
    >
      {size === 'small' && <FontAwesomeIcon icon={faArrowToTop} />}
      {size === 'large' && (
        <>
          <FontAwesomeIcon icon={faArrowToTop} size="sm" />
          <span>collapse</span>
        </>
      )}
    </Button>
  );
}
