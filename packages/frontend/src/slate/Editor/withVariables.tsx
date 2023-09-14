import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

import { useTheme } from '@emotion/react';
import Fuse from 'fuse.js';
import { Editor, Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { SlateElement } from '@kenchi/slate-tools/lib/types';
import { TextEditorPopover } from '@kenchi/ui/lib/Dashboard/TextEditorPopover';

import usePopoverState from './usePopoverState';

export default function withVariables(editor: ReactEditor) {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === 'variable' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'variable' ? true : isVoid(element);
  };

  return editor;
}

export type VariablesRef = {
  onKeyDown: (e: React.KeyboardEvent) => void;
};

function getTargetAndInputValue(editor: ReactEditor): [Range, string] | null {
  const { selection } = editor;

  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    // Using line instead of word so we have the ability to inline @
    // (e.g. "foo@bar" should typeahead, not just "foo @bar")
    const lineBefore = Editor.before(editor, start, { unit: 'line' });
    const matchRange = lineBefore && Editor.range(editor, lineBefore, start);
    const matchText = matchRange && Editor.string(editor, matchRange);
    const beforeMatch = matchText && matchText.match(/@([\w ]*)$/);

    if (beforeMatch) {
      const before = Editor.before(editor, start, {
        distance: beforeMatch[1].length + 1,
        unit: 'character',
      });
      const beforeRange = before && Editor.range(editor, before, start);
      if (beforeRange) {
        return [beforeRange, beforeMatch[1]];
      }
    }
  }
  return null;
}

export const Variables = forwardRef(
  ({ variables }: { variables: ToolInput[] }, ref: React.Ref<VariablesRef>) => {
    const editor = useSlate();
    const [target, setTarget] = useState<Range | null>(null);
    const [index, setIndex] = useState(0);
    const [search, setSearch] = useState('');

    useEffect(() => {
      const res = getTargetAndInputValue(editor);
      if (res) {
        setTarget(res[0]);
        setSearch(res[1]);
        setIndex(0);
      } else {
        setTarget(null);
      }
      // editor.selection will change anytime we type or move the cursor
    }, [editor, editor.selection]);

    const fuse = useMemo(() => {
      return new Fuse(variables, {
        shouldSort: true,
        threshold: 0.4, // 0 is perfect match
        location: 0,
        distance: 100,
        minMatchCharLength: 1,
        keys: ['placeholder', 'id'],
      });
    }, [variables]);

    const filteredVariables = useMemo(() => {
      const results =
        search === ''
          ? [...variables]
          : fuse.search(search).map((result) => result.item);
      if (search !== '') {
        results.push({
          id: '$new',
          source: 'input',
          placeholder: `Ask for ${search} before running`,
        });
      }
      return results;
    }, [fuse, variables, search]);

    const selectActive = useCallback(
      (e) => {
        e.preventDefault();
        if (!target) {
          return;
        }
        Transforms.select(editor, target);
        const selected = filteredVariables[index];
        let id = selected.id;
        let placeholder = selected.placeholder;
        if (id === '$new') {
          id = search;
          let suffix = 0;
          while (true) {
            const candidateId = id + (suffix > 0 ? suffix : '');
            if (!variables.find((v) => v.id === candidateId)) {
              id = candidateId;
              break;
            }
            suffix++;
          }
          placeholder = id;
        }

        const mention: SlateElement = {
          type: 'variable',
          id,
          placeholder,
          source: selected.source,
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, mention);
        Transforms.move(editor);

        setTarget(null);
      },
      [editor, target, search, index, filteredVariables, variables]
    );

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown(event) {
          if (target) {
            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                const prevIndex =
                  index >= filteredVariables.length - 1 ? 0 : index + 1;
                setIndex(prevIndex);
                break;
              case 'ArrowUp':
                event.preventDefault();
                const nextIndex =
                  index <= 0 ? filteredVariables.length - 1 : index - 1;
                setIndex(nextIndex);
                break;
              case 'Tab':
              case 'Enter':
                selectActive(event);
                break;
              default:
                break;
            }
          }
        },
      }),
      [index, target, filteredVariables.length, selectActive]
    );

    const popoverProps = usePopoverState(target);
    const { colors } = useTheme();

    if (!target || filteredVariables.length === 0) {
      return null;
    }

    return (
      <TextEditorPopover {...popoverProps}>
        <div
          style={{
            background: colors.gray[0],
            color: colors.gray[12],
          }}
        >
          {filteredVariables.map(({ id, placeholder }, i) => (
            <div
              onClick={selectActive}
              onMouseEnter={() => setIndex(i)}
              key={id}
              style={{
                padding: '2px 4px',
                cursor: 'pointer',
                background: i === index ? colors.accent[5] : 'transparent',
              }}
            >
              {placeholder}
            </div>
          ))}
        </div>
      </TextEditorPopover>
    );
  }
);
