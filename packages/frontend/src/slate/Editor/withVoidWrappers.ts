// The void wrapper provides/handles spacers around either side of void
// elements so that a cursor can be there, making doing things like selecting
// void elements and moving them around lists much easier. The void-wrapper
// itself is not void, only the void-spacer and whatever element it's wrapping

import { Editor, Element, Node, Path, Range, Text, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';

import { isListItem, isVoidWrapped } from './utils';
import { shouldSplitListItemOnBreak } from './withLists';

/**
 * Returns:
 *   -1 if the cursor is on the left void-spacer
 *   0 if it's on the element
 *   1 if it's on the right void-spacer
 *   false otherwise
 * Presumes a properly normalized void-wrapper
 **/
function sideOfVoidWrapper(editor: Editor) {
  if (!editor.selection) {
    return false;
  }

  if (
    !Editor.above(editor, {
      match: (n) => Element.isElement(n) && n.type === 'void-wrapper',
    })
  ) {
    return false;
  }

  if (!Range.isCollapsed(editor.selection)) {
    return false;
  }

  const path = editor.selection.anchor.path;
  const lastPos = path[path.length - 2];
  return lastPos - 1;
}

export function onCut(editor: ReactEditor, event: React.ClipboardEvent) {
  const voidEntry = Editor.void(editor);
  if (voidEntry) {
    event.preventDefault();
    editor.setFragmentData(event.clipboardData);
    Transforms.delete(editor, { at: voidEntry[1] });
  }
}

export function onCopy(editor: ReactEditor, event: React.ClipboardEvent) {
  const voidEntry = Editor.void(editor);
  if (voidEntry) {
    event.preventDefault();
    editor.setFragmentData(event.clipboardData);
  }
}

export default function withVoidWrappers(editor: ReactEditor) {
  const { isVoid, deleteBackward, insertBreak, insertText, normalizeNode } =
    editor;
  editor.isVoid = (element) =>
    element.type === 'void-spacer' ? true : isVoid(element);

  editor.deleteBackward = (unit) => {
    if (!editor.selection) {
      return deleteBackward(unit);
    }

    const side = sideOfVoidWrapper(editor);
    if (side === -1) {
      const voidSpacerPath = Path.parent(editor.selection.anchor.path);
      const voidWrapperPath = Path.parent(voidSpacerPath);

      const before = Editor.before(editor, editor.selection);
      if (before) {
        const beforeListItem = Editor.above(editor, {
          at: before,
          match: isListItem,
        });
        if (beforeListItem) {
          const [beforeListItemNode, beforeListItemPath] = beforeListItem;
          const lastChildIndex = beforeListItemNode.children.length - 1;
          const lastChildNode = beforeListItemNode.children[lastChildIndex];
          if (
            Element.isElement(lastChildNode) &&
            lastChildNode.type === 'paragraph' &&
            Text.isTextList(lastChildNode.children) &&
            Node.string(lastChildNode) === ''
          ) {
            // If you're backspacing onto an empty paragraph, take it over.
            Editor.withoutNormalizing(editor, () => {
              Transforms.removeNodes(editor, {
                at: [...beforeListItemPath, lastChildIndex],
              });
              Transforms.moveNodes(editor, {
                at: voidWrapperPath,
                to: [...beforeListItemPath, lastChildIndex],
              });
            });
          } else {
            // Otherwise append
            Transforms.moveNodes(editor, {
              at: voidWrapperPath,
              to: [...beforeListItemPath, lastChildIndex + 1],
            });
          }
          return;
        }
      }

      if (voidWrapperPath[voidWrapperPath.length - 1] > 0) {
        const previous = Path.previous(voidWrapperPath);
        if (Node.string(Node.get(editor, previous)) === '') {
          Transforms.removeNodes(editor, { at: previous });
          return;
        }
      }
    } else if (side === false && !Editor.above(editor, { match: isListItem })) {
      // If we're currently inside a list and not working with a void wrapper
      // fallback to withLists handling
      const before = Editor.before(editor, editor.selection.anchor);
      if (before) {
        const node = Node.get(editor, Path.parent(before.path));
        if (before && Element.isElement(node) && isVoidWrapped(node)) {
          Transforms.delete(editor, { unit, reverse: true, voids: true });
          return;
        }
      }
    }

    return deleteBackward(unit);
  };

  editor.insertBreak = () => {
    if (!editor.selection) {
      return insertBreak();
    }

    const side = sideOfVoidWrapper(editor);
    if (side === -1) {
      const parent = Path.parent(Path.parent(editor.selection.anchor.path));
      Transforms.insertNodes(
        editor,
        { type: 'paragraph', children: [{ text: '' }] },
        { at: parent }
      );
      if (shouldSplitListItemOnBreak(editor)) {
        Transforms.splitNodes(editor, { always: true, match: isListItem });
      }
      return;
    } else if (side === 1) {
      Editor.withoutNormalizing(editor, () => {
        if (!editor.selection) {
          return;
        }
        const parent = Path.parent(Path.parent(editor.selection.anchor.path));
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [{ text: '' }] },
          { at: Path.next(parent), select: true }
        );
        if (shouldSplitListItemOnBreak(editor)) {
          Transforms.splitNodes(editor, { always: true, match: isListItem });
          Transforms.removeNodes(editor, { at: Path.next(parent) });
        }
      });
      return;
    }

    return insertBreak();
  };

  editor.insertText = (text) => {
    const side = sideOfVoidWrapper(editor);
    if (side === -1) {
      editor.insertBreak();
      Transforms.move(editor, { reverse: true });
    } else if (side === 1) {
      editor.insertBreak();
    }
    return insertText(text);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (!Element.isElement(node)) {
      return normalizeNode(entry);
    }

    if (node.type === 'void-wrapper') {
      const voidElementIndex = node.children.findIndex(
        (n) => Element.isElement(n) && (isVoidWrapped(n) || n.type === 'link')
      );
      if (voidElementIndex === -1) {
        // If the element no longer exists we have no reason to
        Transforms.removeNodes(editor, { at: path, voids: true });
        if (path.length === 1 && path[0] === 0) {
          // Avoid the risk of making an empty doc
          Transforms.insertNodes(
            editor,
            { type: 'paragraph', children: [{ text: '' }] },
            { at: path, select: true }
          );
        }
        return;
      }

      // Must always have spacers on the outsides
      if (voidElementIndex === 0) {
        Transforms.insertNodes(
          editor,
          { type: 'void-spacer', children: [{ text: '' }] },
          { at: [...path, 0] }
        );
        return;
      }

      if (node.children.length < 3) {
        // This is because we hit enter at the end of the element, move the cursor
        Transforms.insertNodes(
          editor,
          { type: 'void-spacer', children: [{ text: '' }] },
          { at: [...path, 2] }
        );
        return;
      }

      let foundVoidWrapped = false;
      for (var i = 0; i < node.children.length; i++) {
        const subnode = node.children[i];
        if (Element.isElement(subnode) && isVoidWrapped(subnode)) {
          if (foundVoidWrapped) {
            // Two void wrapped nodes in the same wrapper, push this one out
            Transforms.liftNodes(editor, { at: [...path, i], voids: true });
          } else {
            foundVoidWrapped = true;
          }
        } else if (subnode.type !== 'void-spacer') {
          // Random node inside wrapper, push it out
          Transforms.liftNodes(editor, { at: [...path, i], voids: true });
        }
      }

      return;
    }

    if (node.type === 'void-spacer') {
      // Must always be empty
      if (node.children.length > 1) {
        Transforms.removeNodes(editor, { at: [...path, 1], voids: true });
        return;
      }
    }

    return normalizeNode(entry);
  };

  return editor;
}
