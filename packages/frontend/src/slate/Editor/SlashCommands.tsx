import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

import { css } from '@emotion/react';
import { Editor, Element, Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { BaseButton } from '@kenchi/ui/lib/Button';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { TextEditorPopover } from '@kenchi/ui/lib/Dashboard/TextEditorPopover';

import { Key } from '../../components/HotkeysHelp';
import usePopoverState from './usePopoverState';

export type SlashCommandsRef = {
  onKeyDown: (e: React.KeyboardEvent) => void;
};

function getTargetAndInputValue(editor: ReactEditor): [Range, string] | null {
  const { selection } = editor;

  if (!(selection && Range.isCollapsed(selection))) {
    return null;
  }

  const [startOfSelection] = Range.edges(selection);
  // Using line instead of word so we have the ability to inline @
  // (e.g. "foo@bar" should typeahead, not just "foo @bar")
  const lineBefore = Editor.before(editor, startOfSelection, {
    unit: 'line',
  });
  const rangeToTest =
    lineBefore && Editor.range(editor, lineBefore, startOfSelection);
  const textToTest = rangeToTest && Editor.string(editor, rangeToTest);

  const match = textToTest && textToTest.match(/\/([a-z0-9]*$)/i);

  const startOfMatch =
    match &&
    Editor.before(editor, startOfSelection, {
      distance: match[0].length + 1,
      unit: 'character',
    });
  const matchAsRange =
    startOfMatch && Editor.range(editor, startOfMatch, startOfSelection);
  if (matchAsRange) {
    return [matchAsRange, match[1]];
  }
  return null;
}

type Command = {
  name: string;
  keywords?: string[];
  onSelect: (editor: ReactEditor) => void;
};

const COMMANDS: Command[] = [
  {
    keywords: ['if', 'else'],
    name: 'Conditional',
    onSelect: (editor) => {
      Transforms.wrapNodes(editor, {
        type: 'conditional',
        isChained: false,
        condition: null,
        children: [{ text: '' }],
      });
    },
  },
  {
    keywords: ['icon'],
    name: 'Status Line',
    onSelect: (editor) => {
      const entry = Editor.above(editor, {
        match: (n) =>
          Element.isElement(n) && (!n.type || n.type === 'paragraph'),
      });
      if (!entry) {
        return;
      }
      Transforms.setNodes(
        editor,
        { type: 'status', icon: '' },
        { at: entry[1] }
      );
    },
  },
];

type Props = {};

export const SlashCommands = forwardRef(
  ({}: Props, ref: React.Ref<SlashCommandsRef>) => {
    const editor = useSlate();
    const [target, setTarget] = useState<Range | null>(null);
    const [filterValue, setFilterValue] = useState('');

    useEffect(() => {
      const res = getTargetAndInputValue(editor);
      if (res) {
        setTarget(res[0]);
        setFilterValue(res[1]);
      } else {
        setTarget(null);
      }
      // editor.selection will change anytime we type or move the cursor
    }, [editor, editor.selection]);

    const filteredSlashCommands = useMemo(
      () =>
        COMMANDS.filter((slashCommand) => {
          return [slashCommand.name, ...(slashCommand.keywords || [])].some(
            (string) =>
              string
                .toLocaleLowerCase()
                .includes(filterValue.toLocaleLowerCase())
          );
        }),
      [filterValue]
    );

    const [fakeFocusedCommandName, setFakeFocusedCommandName] = useState(
      filteredSlashCommands[0]?.name
    );

    const runCommand = useCallback(
      (command: Command) => {
        if (target) {
          Transforms.delete(editor, { at: target });
          setTarget(null);
        }
        command.onSelect(editor);
      },
      [editor, target]
    );

    const runFakeFocusedCommand = useCallback(() => {
      const slashCommand = filteredSlashCommands.find(
        (slashCommand) => slashCommand.name === fakeFocusedCommandName
      );
      if (slashCommand) {
        runCommand(slashCommand);
      }
    }, [fakeFocusedCommandName, filteredSlashCommands, runCommand]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown(event) {
          if (target) {
            const index = filteredSlashCommands.indexOf(
              filteredSlashCommands.find(
                (cmd) => cmd.name === fakeFocusedCommandName
              )!
            );
            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                const prevIndex =
                  index >= filteredSlashCommands.length - 1 ? 0 : index + 1;
                setFakeFocusedCommandName(
                  filteredSlashCommands[prevIndex].name
                );
                break;
              case 'ArrowUp':
                event.preventDefault();
                const nextIndex =
                  index <= 0 ? filteredSlashCommands.length - 1 : index - 1;
                setFakeFocusedCommandName(
                  filteredSlashCommands[nextIndex].name
                );
                break;
              case 'Tab':
              case 'Enter':
                event.preventDefault();
                runFakeFocusedCommand();
                break;
              default:
                break;
            }
          }
        },
      }),
      [
        fakeFocusedCommandName,
        filteredSlashCommands,
        runFakeFocusedCommand,
        target,
      ]
    );

    const props = usePopoverState(target);

    useEffect(() => {
      setFakeFocusedCommandName(filteredSlashCommands[0]?.name);
    }, [filteredSlashCommands]);

    return (
      <TextEditorPopover {...props}>
        <div
          css={css`
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            min-width: 10rem;
          `}
        >
          {filteredSlashCommands.length === 0 && (
            <div
              css={css`
                height: 2rem;
                display: grid;
                align-items: center;
                justify-content: center;
              `}
            >
              No commands
            </div>
          )}
          {filteredSlashCommands.map((command, index) => (
            <BaseButton
              key={index}
              onClick={() => runCommand(command)}
              size="small"
              data-fake-focused={fakeFocusedCommandName === command.name}
              css={({ colors }: KenchiTheme) => css`
                text-align: left;
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 0.5rem;
                background-color: ${colors.gray[0]};
                transition: none;
                &[data-fake-focused='true'] {
                  background-color: ${colors.accent[4]};
                }
                &:hover {
                  background-color: ${colors.accent[4]};
                }
              `}
            >
              <span>{command.name}</span>
              {fakeFocusedCommandName === command.name && (
                <div>
                  <Key>⏎</Key>
                </div>
              )}
            </BaseButton>
          ))}
        </div>
      </TextEditorPopover>
    );
  }
);
