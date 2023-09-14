import {
  faIndent,
  faListOl,
  faListUl,
  faOutdent,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Editor,
  Element,
  Node,
  NodeEntry,
  Path,
  Point,
  Range,
  Text,
  Transforms,
} from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { SlateElement } from '@kenchi/slate-tools/lib/types';

import { Button } from './Toolbar';
import { isEmptyRecursive, isList, isListItem, isVoidWrapped } from './utils';
import { isCollapsibleListItem } from './withCollapsible';

function unwrapListItem(editor: Editor) {
  Editor.withoutNormalizing(editor, () => {
    const [listItem] = findClosestParentListItem(editor);
    if (listItem?.type === 'collapsible-list-item') {
      Transforms.setNodes<SlateElement>(
        editor,
        { type: 'collapsible', children: [] },
        {
          match: isListItem,
          mode: 'lowest',
          voids: true,
        }
      );
    } else {
      // The voids need to be there so that splitting works properly, unclear why
      Transforms.unwrapNodes(editor, {
        match: isListItem,
        split: true,
        voids: true,
      });
    }
    Transforms.unwrapNodes(editor, {
      match: isList,
      split: true,
      voids: true,
    });
  });
}

function findClosestParentListItem(
  editor: Editor
): NodeEntry<SlateElement> | [null, null] {
  const rtn = Editor.above(editor, { match: isListItem });
  return rtn ? rtn : [null, null];
}

function findClosestParentList(
  editor: Editor
): [SlateElement, Path] | [null, null] {
  // Almost `Editor.above` but we need to include exact path matches
  if (!editor.selection) {
    return [null, null];
  }
  const path = Editor.path(editor, editor.selection);

  for (const [n, p] of Editor.levels(editor, {
    at: path,
    voids: false,
    match: isList,
    reverse: true,
  })) {
    if (Element.isElement(n) && !Text.isText(n)) {
      return [n, p];
    }
  }

  return [null, null];
}

function isPointAtStartOf(parent: Path, child: Point, skipFirst = 0) {
  const { path, offset } = child;
  if (!Path.isDescendant(path, parent)) {
    return false;
  }
  for (let i = parent.length + skipFirst; i < path.length; i++) {
    if (path[i] !== 0) {
      return false;
    }
  }
  return offset === 0;
}

function shouldWorkWithListItem(editor: Editor) {
  // Only work...
  // ... with a collapsed selection
  if (!editor.selection || !Range.isCollapsed(editor.selection)) {
    return false;
  }

  // ... in a list
  const [listItem] = findClosestParentListItem(editor);
  if (!listItem) {
    return false;
  }

  // Not highlighting a Kenchi Element
  const immediateNode = Editor.above(editor);
  if (
    immediateNode &&
    Element.isElement(immediateNode[0]) &&
    isVoidWrapped(immediateNode[0])
  ) {
    return false;
  }

  return true;
}

function canIndent(editor: Editor) {
  const [, listItemPath] = findClosestParentListItem(editor);
  if (!listItemPath) {
    return false;
  }

  // Don't allow you to double indent
  return listItemPath[listItemPath.length - 1] !== 0;
}

function doIndent(editor: Editor) {
  if (!canIndent(editor)) {
    return false;
  }

  Editor.withoutNormalizing(editor, () => {
    const [, listItemPath] = findClosestParentListItem(editor);
    if (!listItemPath) {
      // Impossible because of the canIndent check, just for TS
      return;
    }
    Transforms.wrapNodes(
      editor,
      { type: 'bulleted-list', children: [] },
      { at: listItemPath }
    );
    // This'll immediately be merged with above node
    Transforms.wrapNodes(
      editor,
      { type: 'list-item', children: [] },
      { at: listItemPath }
    );
    Transforms.mergeNodes(editor, { at: listItemPath });
  });

  return true;
}

function canOutdent(editor: Editor) {
  const [, listItemPath] = findClosestParentListItem(editor);
  if (!listItemPath) {
    return false;
  }

  for (const [node] of Node.ancestors(editor, Path.parent(listItemPath))) {
    if (isList(node)) {
      return true;
    }
  }
  return false;
}

function doOutdent(editor: Editor) {
  if (!canOutdent(editor)) {
    return false;
  }

  Editor.withoutNormalizing(editor, () => {
    const [, listItemPath] = findClosestParentListItem(editor);
    if (!listItemPath) {
      // Impossible because of the canOutdent check, just for TS
      return;
    }

    if (listItemPath[listItemPath.length - 1] === 0) {
      const listPath = Path.parent(listItemPath);
      if (listPath[listPath.length - 1] === 0) {
        Transforms.unwrapNodes(editor, { match: isList });
      } else {
        const hasSiblings = Node.has(editor, Path.next(listItemPath));
        Transforms.unwrapNodes(editor, { match: isList, split: true });
        Transforms.liftNodes(editor, { match: isListItem });
        if (hasSiblings) {
          const [, newListItemPath] = findClosestParentListItem(editor);
          if (!newListItemPath) {
            // Should be impossible
            return;
          }
          Transforms.mergeNodes(editor, { at: Path.next(newListItemPath) });
        }
      }
    } else {
      Transforms.unwrapNodes(editor, { match: isList, split: true });
      Transforms.liftNodes(editor, { match: isListItem });
    }
  });

  return true;
}

export function shouldSplitListItemOnBreak(editor: Editor) {
  const [listItem] = findClosestParentListItem(editor);
  // Pressing Shift+Enter
  // should split block normally
  return !!listItem;
}

export default function withLists(editor: ReactEditor) {
  const { deleteBackward, insertBreak, normalizeNode } = editor;

  editor.deleteBackward = (unit) => {
    const selection = editor.selection;
    const [listItemNode, listItemPath] = findClosestParentListItem(editor);
    if (
      listItemPath &&
      selection &&
      shouldWorkWithListItem(editor) &&
      isPointAtStartOf(listItemPath, selection.anchor, 1)
    ) {
      const selectionPath = selection.anchor.path;

      if (selectionPath[listItemPath.length] === 0) {
        if (listItemPath[listItemPath.length - 1] === 0) {
          // If we're at the beginning of the line and the first list item move us out of the list
          unwrapListItem(editor);
        } else {
          // Otherwise turn the bullet into a paragraph of the previous list item
          Transforms.mergeNodes(editor, { match: isListItem });
        }
        return;
      } else {
        // If we're at the beginning of an immediately descending block break the list
        let blocksBetweenSelectionAndListItem = 0;
        const path = Editor.path(editor, selection);
        for (const [parent] of Node.ancestors(editor, path)) {
          if (Element.isElement(parent) && Editor.isBlock(editor, parent)) {
            if (isListItem(parent)) {
              break;
            }
            blocksBetweenSelectionAndListItem += 1;
          }
        }
        if (blocksBetweenSelectionAndListItem < 2) {
          Editor.withoutNormalizing(editor, () => {
            // We can't use unwrapListItem because we *always* want to split, even
            // if there's a collapsible. Also if a collapsible we need to convert
            // any split back into a regular list item.
            let pathRefToUncollapse = null;
            if (listItemNode && isCollapsibleListItem(listItemNode)) {
              const selectedChild = selectionPath[listItemPath.length];
              if (listItemNode.children.length >= selectedChild) {
                pathRefToUncollapse = Editor.pathRef(editor, [
                  ...listItemPath,
                  selectedChild + 1,
                ]);
              }
            }
            Transforms.unwrapNodes(editor, {
              match: isListItem,
              split: true,
              voids: true,
            });
            Transforms.unwrapNodes(editor, {
              match: isList,
              split: true,
              voids: true,
            });
            if (pathRefToUncollapse) {
              const pathToUncollapse = pathRefToUncollapse.unref()!;
              Transforms.setNodes(
                editor,
                // @ts-ignore we want to unset the id
                { type: 'list-item', id: null },
                { match: isCollapsibleListItem, at: pathToUncollapse }
              );
            }
          });

          return;
        }
      }
    }

    deleteBackward(unit);
  };

  editor.insertBreak = () => {
    const [listItem] = findClosestParentListItem(editor);
    if (listItem) {
      if (isEmptyRecursive(editor, listItem)) {
        unwrapListItem(editor);
      } else {
        const originallySelectedNode =
          editor.selection &&
          Node.get(editor, Path.parent(editor.selection.anchor.path));

        Transforms.splitNodes(editor, { always: true, match: isListItem });

        // For some reason we end up re-selecting the void element when hitting enter after it. Offset this.
        const selectedNode =
          editor.selection &&
          Node.get(editor, Path.parent(editor.selection.anchor.path));
        if (
          Element.isElement(originallySelectedNode) &&
          !isVoidWrapped(originallySelectedNode) &&
          Element.isElement(selectedNode) &&
          isVoidWrapped(selectedNode)
        ) {
          Transforms.move(editor, { distance: 2, unit: 'line' });
        }
      }
      // TODO: if the node is empty maybe exit the list (GDocs does this)
      return;
    }
    insertBreak();
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (!Element.isElement(node)) {
      return normalizeNode(entry);
    }

    if (isListItem(node)) {
      // All list items should be inside lists
      if (!isList(Node.parent(editor, path))) {
        Transforms.wrapNodes(
          editor,
          { type: 'bulleted-list', children: [] },
          { at: path }
        );
        return;
      }

      // All list-item children should be blocks. Find contiguous ranges of inlines and wrap them in a paragraph
      let start: number | null = null;
      let end: number | null = null;
      for (var i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const isNonBlock =
          (Element.isElement(child) && editor.isInline(child)) ||
          Text.isText(child);
        if (isNonBlock) {
          if (start === null) {
            start = i;
          }
          end = i;
        }
        if (start !== null && !isNonBlock) {
          break;
        }
      }

      if (start !== null && end !== null) {
        Transforms.wrapNodes(
          editor,
          { type: 'paragraph', children: [] },
          {
            match: (_, matchPath) => matchPath.length > path.length,
            at: path,
            split: false,
            mode: 'highest',
          }
        );
        return;
      }
    } else if (isList(node)) {
      // If there are two lists next to each other merge them
      const lastPathIndex = path[path.length - 1];
      if (lastPathIndex > 0) {
        const sibling = Node.get(editor, Path.previous(path));
        if (Element.isElement(sibling) && sibling.type === node.type) {
          Transforms.mergeNodes(editor, { at: path });
          return;
        }
      }

      const parent = Node.parent(editor, path);
      if (lastPathIndex < parent.children.length - 1) {
        const nextSiblingPath = Path.next(path);
        const sibling = Node.get(editor, nextSiblingPath);
        if (Element.isElement(sibling) && sibling.type === node.type) {
          Transforms.mergeNodes(editor, { at: nextSiblingPath });
          return;
        }
      }

      // If there are no list items inside of us unwrap ourselves
      if (node.children.every((child) => !isListItem(child))) {
        Transforms.unwrapNodes(editor, { at: path });
        return;
      }

      // If there are some missing list-items wrap them
      let replacedChild = false;
      node.children.forEach((child, idx) => {
        if (!isListItem(child)) {
          Transforms.wrapNodes(
            editor,
            { type: 'list-item', children: [] },
            { at: [...path, idx] }
          );
          replacedChild = true;
        }
      });
      if (replacedChild) {
        return;
      }
    }

    // Fall back to the original `normalizeNode` to enforce other constraints.
    return normalizeNode(entry);
  };

  return editor;
}

type ToggleableTypes =
  | 'paragraph'
  | 'heading'
  | 'numbered-list'
  | 'bulleted-list';

export function onKeyDown(editor: Editor, event: React.KeyboardEvent) {
  if (event.key !== 'Tab') {
    return;
  }

  if (!shouldWorkWithListItem(editor)) {
    return;
  }

  if (event.shiftKey) {
    doOutdent(editor);
  } else {
    doIndent(editor);
  }

  // If we're in a list at all then prevent us from tabbing out of the contenteditable
  event.preventDefault();
}

export function toggleList(editor: Editor, type: ToggleableTypes) {
  const activeListType = closestListType(editor);
  if (activeListType === type) {
    // Remove the list
    unwrapListItem(editor);
  } else if (activeListType) {
    // Change the list type
    const props: Partial<SlateElement> = { type };
    Transforms.setNodes(editor, props, { match: isList });
  } else {
    // Add new list type
    Editor.withoutNormalizing(editor, () => {
      const { selection } = editor;
      if (selection && Range.isExpanded(selection)) {
        // Wrap every top node in a list item unless it's already a list
        const [{ path: startPath }, { path: endPath }] = Range.edges(selection);
        let startOfListWrap: number | null = null;
        let endOfListWrap: number | null = null;
        const wrapList = () => {
          if (startOfListWrap !== null && endOfListWrap !== null) {
            const at: Range = {
              anchor: { path: [startOfListWrap], offset: 0 },
              focus: { path: [endOfListWrap], offset: 0 },
            };
            Transforms.wrapNodes(
              editor,
              { type, children: [] },
              { match: isListItem, at }
            );
          }
          startOfListWrap = null;
          endOfListWrap = null;
        };
        for (var i = startPath[0]; i <= endPath[0]; i++) {
          const node = Node.get(editor, [i]);
          if (isList(node)) {
            wrapList();
          } else {
            Transforms.wrapNodes(
              editor,
              { type: 'list-item', children: [] },
              {
                at: [i],
                match: (n) => Editor.isBlock(editor, n) && !editor.isVoid(n),
              }
            );
            if (startOfListWrap === null) {
              startOfListWrap = i;
            }
            endOfListWrap = i;
          }
        }
        wrapList();
      } else {
        Transforms.wrapNodes(
          editor,
          { type: 'list-item', children: [] },
          { match: (n) => Editor.isBlock(editor, n) && !editor.isVoid(n) }
        );

        Transforms.wrapNodes(
          editor,
          { type, children: [] },
          {
            match: isListItem,
          }
        );
      }
    });
  }
}

const closestListType = (editor: Editor) => {
  const [list] = findClosestParentList(editor);
  return list?.type;
};

type BlockButtonProps = {
  format: ToggleableTypes;
  icon: IconDefinition;
  tooltip: string;
};
const BlockButton = ({ format, icon, tooltip }: BlockButtonProps) => {
  const editor = useSlate();
  return (
    <Button
      tooltip={tooltip}
      active={closestListType(editor) === format}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleList(editor, format);
      }}
    >
      <FontAwesomeIcon icon={icon} />
    </Button>
  );
};

type DentButtonProps = {
  check: (editor: Editor) => boolean;
  action: (editor: Editor) => void;
  icon: IconDefinition;
  tooltip: string;
};
const DentButton = ({ check, action, icon, tooltip }: DentButtonProps) => {
  const editor = useSlate();
  const active = check(editor);
  return (
    <Button
      tooltip={tooltip}
      active={active}
      disabled={!active}
      onMouseDown={(event) => {
        event.preventDefault();
        action(editor);
      }}
    >
      <FontAwesomeIcon icon={icon} />
    </Button>
  );
};

export function Toolbar({ size }: { size: 'small' | 'large' }) {
  return (
    <>
      <BlockButton
        tooltip="Numbered list"
        format="numbered-list"
        icon={faListOl}
      />
      <BlockButton
        tooltip="Bulleted list"
        format="bulleted-list"
        icon={faListUl}
      />
      {size === 'large' && (
        <>
          <DentButton
            tooltip="Decrease indent"
            check={canOutdent}
            action={doOutdent}
            icon={faOutdent}
          />
          <DentButton
            tooltip="Increase indent"
            check={canIndent}
            action={doIndent}
            icon={faIndent}
          />
        </>
      )}
    </>
  );
}
