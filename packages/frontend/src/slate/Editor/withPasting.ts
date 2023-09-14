import { ApolloClient } from '@apollo/client';
import {
  Editor,
  Element,
  Location,
  Node,
  NodeEntry,
  Path,
  Range,
  Text,
  Transforms,
} from 'slate';
import { ReactEditor } from 'slate-react';

import { fromHTML } from '@kenchi/slate-tools/lib/fromHTML';

import { isList, isListItem } from './utils';
import { handleUploadComplete, uploadImageFromURL } from './withImages';

/**
 * Ok this suuuuuucks. We want to make it so that when you paste a list into
 * another list, they merge at the same level rather than creating a new
 * sub-list. For example, given:
 *
 *   - ABC<cursor />
 *
 * When you paste:
 *
 *   -
 *   - DEF
 *
 * You end up with:
 *
 *   - ABC
 *     - DEF
 *
 * Which is not what we want. We instead want:
 *
 *   - ABC
 *   - DEF
 *
 * I don't believe it's possible to craft a fragment that accomplushes this with
 * the current insertFragment code (see
 * https://github.com/ianstormtaylor/slate/blob/2a8d86f1a40bcc806422e6fe3658ddd810ce73a5/packages/slate/src/transforms/text.ts#L231)
 * so we have to do it ourselves. That code handles 3 groups:
 *   - start: inline stuff that goes right next to wherever you're pasting
 *   - middle: blocks which get inserted adjacent to the nearest block (in above
 *     example adjacent to the <p>)
 *   - end: more inline stuff that goes before the stuff that was on the right
 *          side of the cursor when you pasted.
 *
 * We flat out copy-paste the method linked above and make 2 changes:
 *   1. Create a 4th group, listItems, consisting of all the list items that are
 *      immediately after start. When we go to insert those we make sure we do
 *      so next to the paste-point's nearest list.
 *   2. Adjust middle so that it's inserted one level higher than it is in the
 *      slate method so it breaks out of the list.
 */
function insertListIntoList(editor: Editor, fragment: Node[]): void {
  Editor.withoutNormalizing(editor, () => {
    const voids = false;

    if (!editor.selection) {
      return;
    }
    let at: Location = editor.selection;

    at = Editor.unhangRange(editor, at);

    if (Range.isCollapsed(at)) {
      at = at.anchor;
    } else {
      const [, end] = Range.edges(at);

      if (!voids && Editor.void(editor, { at: end })) {
        return;
      }

      const pointRef = Editor.pointRef(editor, end);
      Transforms.delete(editor, { at });
      at = pointRef.unref()!;
    }

    // If the insert point is at the edge of an inline node, move it outside
    // instead since it will need to be split otherwise.
    const inlineElementMatch = Editor.above(editor, {
      at,
      match: (n) => Editor.isInline(editor, n),
      mode: 'highest',
      voids,
    });

    if (inlineElementMatch) {
      const [, inlinePath] = inlineElementMatch;

      if (Editor.isEnd(editor, at, inlinePath)) {
        const after = Editor.after(editor, inlinePath)!;
        at = after;
      } else if (Editor.isStart(editor, at, inlinePath)) {
        const before = Editor.before(editor, inlinePath)!;
        at = before;
      }
    }

    const blockMatch = Editor.above(editor, {
      match: (n) => Editor.isBlock(editor, n),
      at,
      voids,
    })!;
    const [, blockPath] = blockMatch;
    const isBlockStart = Editor.isStart(editor, at, blockPath);
    const isBlockEnd = Editor.isEnd(editor, at, blockPath);
    const isBlockEmpty = isBlockStart && isBlockEnd;
    const mergeStart = !isBlockStart || (isBlockStart && isBlockEnd);
    const mergeEnd = !isBlockEnd;
    const [, firstPath] = Node.first({ children: fragment }, []);
    const [, lastPath] = Node.last({ children: fragment }, []);

    const matches: NodeEntry[] = [];
    const matcher = ([n, p]: NodeEntry) => {
      const isRoot = p.length === 0;
      if (isRoot) {
        return false;
      }

      if (isBlockEmpty) {
        return true;
      }

      if (
        mergeStart &&
        Path.isAncestor(p, firstPath) &&
        Element.isElement(n) &&
        !editor.isVoid(n) &&
        !editor.isInline(n)
      ) {
        return false;
      }

      if (
        mergeEnd &&
        Path.isAncestor(p, lastPath) &&
        Element.isElement(n) &&
        !editor.isVoid(n) &&
        !editor.isInline(n)
      ) {
        return false;
      }

      return true;
    };

    for (const entry of Node.nodes({ children: fragment }, { pass: matcher })) {
      if (matcher(entry)) {
        matches.push(entry);
      }
    }

    const starts = [];
    const listItems = [];
    const middles = [];
    const ends = [];
    let starting = true;
    let hasBlocks = false;

    for (const [node] of matches) {
      if (Element.isElement(node) && !editor.isInline(node)) {
        starting = false;
        hasBlocks = true;
        if (middles.length === 0 && isListItem(node)) {
          listItems.push(node);
        } else {
          middles.push(node);
        }
      } else if (starting) {
        starts.push(node);
      } else {
        ends.push(node);
      }
    }

    const [inlineMatch] = Editor.nodes(editor, {
      at,
      match: (n) => Text.isText(n) || Editor.isInline(editor, n),
      mode: 'highest',
      voids,
    })!;

    const [, inlinePath] = inlineMatch;
    const isInlineStart = Editor.isStart(editor, at, inlinePath);
    const isInlineEnd = Editor.isEnd(editor, at, inlinePath);

    const [, listItemPath] = Editor.above(editor, {
      at: blockPath,
      match: isListItem,
      mode: 'lowest',
    })!;

    const listItemRef = Editor.pathRef(
      editor,
      isBlockEnd ? Path.next(listItemPath) : listItemPath
    );

    const middleRef = Editor.pathRef(
      editor,
      isBlockEnd
        ? Path.next(Path.parent(listItemPath))
        : Path.parent(listItemPath)
    );

    const endRef = Editor.pathRef(
      editor,
      isInlineEnd ? Path.next(inlinePath) : inlinePath
    );

    const blockPathRef = Editor.pathRef(editor, blockPath);

    Transforms.splitNodes(editor, {
      at,
      match: (n) =>
        hasBlocks
          ? Editor.isBlock(editor, n)
          : Text.isText(n) || Editor.isInline(editor, n),
      mode: hasBlocks ? 'lowest' : 'highest',
      voids,
    });

    const startRef = Editor.pathRef(
      editor,
      !isInlineStart || (isInlineStart && isInlineEnd)
        ? Path.next(inlinePath)
        : inlinePath
    );

    Transforms.insertNodes(editor, starts, {
      at: startRef.current!,
      match: (n) => Text.isText(n) || Editor.isInline(editor, n),
      mode: 'highest',
      voids,
    });

    if (isBlockEmpty && middles.length) {
      Transforms.delete(editor, { at: blockPathRef.unref()!, voids });
    }

    Transforms.insertNodes(editor, listItems, {
      at: listItemRef.current!,
      match: isList,
      mode: 'lowest',
      voids,
    });

    Transforms.insertNodes(editor, middles, {
      at: middleRef.current!,
      match: (n) => Editor.isBlock(editor, n),
      mode: 'lowest',
      voids,
    });

    Transforms.insertNodes(editor, ends, {
      at: endRef.current!,
      match: (n) => Text.isText(n) || Editor.isInline(editor, n),
      mode: 'highest',
      voids,
    });

    let path;

    if (ends.length > 0) {
      path = Path.previous(endRef.current!);
    } else if (listItems.length > 0) {
      path = Path.previous(middleRef.current!);
    } else if (middles.length > 0) {
      path = Path.previous(middleRef.current!);
    } else {
      path = Path.previous(startRef.current!);
    }

    const end = Editor.end(editor, path);
    Transforms.select(editor, end);

    startRef.unref();
    listItemRef.unref();
    middleRef.unref();
    endRef.unref();
  });
}

export default function withPasting(
  editor: ReactEditor,
  client: ApolloClient<object> | null,
  forInsert?: boolean
) {
  const { insertFragment, insertData } = editor;

  editor.insertFragment = (data) => {
    if (editor.selection && data.length > 0 && isList(data[0])) {
      const start = Range.start(editor.selection);
      if (Editor.above(editor, { at: start, match: isListItem })) {
        return insertListIntoList(editor, data);
      }
    }
    return insertFragment(data);
  };

  editor.insertData = (data) => {
    // slate-react doesn't actually ever call editor.insertFragment - it calls
    // the underlying Transforms.insertFragment instead). Fix that.
    const fragment = data.getData('application/x-slate-fragment');
    if (fragment) {
      const decoded = decodeURIComponent(window.atob(fragment));
      const parsed = JSON.parse(decoded);
      editor.insertFragment(parsed);
      return;
    }

    const html = data.getData('text/html');
    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const onImage = (src: string) => {
        if (client && !src.startsWith('https://kenchi-')) {
          // TODO: be smarter
          uploadImageFromURL(src, client).then((result) => {
            handleUploadComplete(src, result);
          });
          return true;
        }
        return false;
      };
      const fragment = fromHTML(parsed.body, {
        splitOnBr: false,
        doubleParagraphs: !!forInsert,
        onImage,
      });
      editor.insertFragment(fragment);
      return;
    }

    // Default slate pasting has an always-split on every line, we only want it
    // after the first line
    const text = data.getData('text/plain');
    if (text) {
      const lines = text.split(/\r\n|\r|\n/);
      let split = false;

      for (const line of lines) {
        if (split) {
          Transforms.splitNodes(editor, { always: true });
        }

        editor.insertText(line);
        split = true;
      }

      return;
    }

    return insertData(data);
  };
  return editor;
}
