import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { Editor, Element, Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import {
  DataSourceVariableElement,
  SlateElement,
} from '@kenchi/slate-tools/lib/types';
import { TextEditorPopover } from '@kenchi/ui/lib/Dashboard/TextEditorPopover';

import { DataSourceVariable } from '../../dashboard/dataSources/types';
import {
  DataSourceVariablesExplorer,
  DataSourceVariablesExplorerRef,
} from './DataSourceVariablesExplorer';
import usePopoverState from './usePopoverState';

export type DataSourceVariablesPopoverRef = {
  onKeyDown: (e: React.KeyboardEvent) => void;
};

function getTargetAndInputValue(editor: ReactEditor): [Range, string] | null {
  const [selectedDataSourceVariableEntry] = Editor.nodes(editor, {
    match: (n): n is DataSourceVariableElement =>
      Element.isElement(n) && n.type === 'data-source-variable',
  });
  if (selectedDataSourceVariableEntry && editor.selection) {
    return [editor.selection, selectedDataSourceVariableEntry[0].placeholder];
  }

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

  const match = textToTest && textToTest.match(/\{([^} ]*)$/);

  const startOfMatch =
    match &&
    Editor.before(editor, startOfSelection, {
      distance: match[1].length + 1,
      unit: 'character',
    });
  const matchAsRange =
    startOfMatch && Editor.range(editor, startOfMatch, startOfSelection);
  if (matchAsRange) {
    return [matchAsRange, match[1]];
  }
  return null;
}

type Props = { variables: Record<string, DataSourceVariable> };

export const DataSourceVariablesPopover = forwardRef(
  ({ variables }: Props, ref: React.Ref<DataSourceVariablesPopoverRef>) => {
    const editor = useSlate();
    const [target, setTarget] = useState<Range | null>(null);
    const [textFilterValue, setTextFilterValue] = useState('');
    const [fakeFocusedVariable, setFakeFocusedVariable] =
      useState<DataSourceVariable | null>(null);
    const explorerRef = useRef<DataSourceVariablesExplorerRef>(null);

    useEffect(() => {
      const res = getTargetAndInputValue(editor);
      if (res) {
        setTarget(res[0]);
        setTextFilterValue(res[1]);
      } else {
        setTarget(null);
      }
      // editor.selection will change anytime we type or move the cursor
    }, [editor, editor.selection]);

    const onSelectVariable = useCallback(
      (dataSourceVariable: DataSourceVariable) => {
        const dataSourceVariableElement: SlateElement = {
          dataSourceVariableId: dataSourceVariable.id,
          type: 'data-source-variable',
          placeholder: `{${dataSourceVariable.path.at(-1)?.toString()!}}`,
          children: [{ text: '' }],
        };
        if (target) {
          Transforms.select(editor, target);
          Transforms.delete(editor, { at: target });
        }
        Transforms.insertNodes(editor, dataSourceVariableElement);
        Transforms.move(editor);
        ReactEditor.focus(editor);

        setTarget(null);
      },
      [editor, target]
    );

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown(event) {
          if (target) {
            explorerRef.current?.onKeyDown(event);
            switch (event.key) {
              case 'Tab':
              case 'Enter':
                if (fakeFocusedVariable) {
                  event.preventDefault();
                  onSelectVariable(fakeFocusedVariable);
                }
                break;
              default:
                break;
            }
          }
        },
      }),
      [fakeFocusedVariable, onSelectVariable, target]
    );

    const popoverProps = usePopoverState(target);

    return (
      <TextEditorPopover {...popoverProps}>
        <DataSourceVariablesExplorer
          onSelectVariable={onSelectVariable}
          fakeFocusedVariable={fakeFocusedVariable}
          onFakeFocusVariable={setFakeFocusedVariable}
          textFilterValue={textFilterValue}
          variables={variables}
          ref={explorerRef}
        />
      </TextEditorPopover>
    );
  }
);
