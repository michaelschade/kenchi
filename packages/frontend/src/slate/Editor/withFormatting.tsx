import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faBold,
  faHeading,
  faUnderline,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import isHotkey from 'is-hotkey';
import { Editor, Element, Node, Path, Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { SlateElement } from '@kenchi/slate-tools/lib/types';

import { Button } from './Toolbar';

type Format = 'bold' | 'italic' | 'underline';
const HOTKEYS: Record<string, Format> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
};

export function onKeyDown(editor: Editor, event: React.KeyboardEvent) {
  for (const hotkey in HOTKEYS) {
    if (isHotkey(hotkey, event as any)) {
      event.preventDefault();
      const mark = HOTKEYS[hotkey];
      toggleMark(editor, mark);
    }
  }
}

const toggleMark = (editor: Editor, format: Format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleBlock = (editor: Editor, format: 'heading') => {
  const isActive = isBlockActive(editor, format);

  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : format,
  };
  Transforms.setNodes(editor, newProperties);
};

const isMarkActive = (editor: Editor, format: Format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === format,
  });

  return !!match;
};

type ButtonProps = {
  icon: IconProp;
  tooltip: string;
  shortcut?: string;
};

const MarkButton = ({
  format,
  icon,
  tooltip,
  shortcut,
}: ButtonProps & { format: Format }) => {
  const editor = useSlate();
  return (
    <Button
      tooltip={tooltip}
      shortcut={shortcut}
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <FontAwesomeIcon icon={icon} />
    </Button>
  );
};

const HeadingButton = ({ icon, tooltip, shortcut }: ButtonProps) => {
  const editor = useSlate();
  return (
    <Button
      tooltip={tooltip}
      shortcut={shortcut}
      active={isBlockActive(editor, 'heading')}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, 'heading');
      }}
    >
      <FontAwesomeIcon icon={icon} />
    </Button>
  );
};

export function Toolbar() {
  return (
    <>
      <MarkButton format="bold" shortcut="B" icon={faBold} tooltip="Bold" />
      <MarkButton
        format="underline"
        shortcut="U"
        icon={faUnderline}
        tooltip="Underline"
      />
      <HeadingButton icon={faHeading} tooltip="Header" />
    </>
  );
}

export default function withFormatting(editor: ReactEditor) {
  const { insertBreak, normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [el, path] = entry;
    // Make sure paragraph children are valid
    if (Element.isElement(el) && el.type === 'paragraph') {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Element.isElement(child) && !editor.isInline(child)) {
          Transforms.liftNodes(editor, { at: childPath });
          return;
        }
      }
    }
    normalizeNode(entry);
  };

  editor.insertBreak = () => {
    const { selection } = editor;
    // If we're at the end of a heading make next section a paragraph
    const [, headingPath] = Editor.above(editor, {
      match: (n) => Element.isElement(n) && n.type === 'heading',
    }) || [null, null];
    if (headingPath && selection && Range.isCollapsed(selection)) {
      const [lastNode, lastPath] = Node.last(editor, headingPath);
      if (
        Path.equals(selection.anchor.path, lastPath) &&
        Node.string(lastNode).length === selection.anchor.offset
      ) {
        Transforms.insertNodes(editor, {
          type: 'paragraph',
          children: [{ text: '' }],
        });
        return;
      }
    }

    return insertBreak();
  };

  return editor;
}
