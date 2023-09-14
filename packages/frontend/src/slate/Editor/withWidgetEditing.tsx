// import { Element, Node, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';

export default function withWidgetEditing(editor: ReactEditor) {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === 'data-source-variable' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'data-source-variable' ? true : isVoid(element);
  };

  // editor.normalizeNode = (entry) => {
  //   const [node, path] = entry;
  //   if (Element.isElement(node) && node.type === 'if') {
  //     if (node.children[0].type !== 'if-condition') {
  //       Transforms.insertNodes(
  //         editor,
  //         { type: 'if-condition', children: [{ text: '' }] },
  //         { at: [...path, 0] }
  //       );
  //       return;
  //     }
  //   } else if (Element.isElement(node) && node.type === 'if-condition') {
  //     const parent =
  //       path.length > 0 ? Node.get(editor, path.slice(0, -1)) : null;
  //     if (!parent || !Element.isElement(parent) || parent.type !== 'if') {
  //       Transforms.removeNodes(editor, { at: path });
  //       return;
  //     }
  //   }
  //   return normalizeNode(entry);
  // };

  return editor;
}
