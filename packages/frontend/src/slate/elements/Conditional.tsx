import { useRef, useState } from 'react';

import styled from '@emotion/styled';
import { faEdit } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';
import { Element, Node, Path, Transforms } from 'slate';
import { ReactEditor, useFocused, useSelected, useSlate } from 'slate-react';

import { ConditionalElement } from '@kenchi/slate-tools/lib/types';
import { SecondaryButton } from '@kenchi/ui/lib/Button';
import { TextEditorPopover } from '@kenchi/ui/lib/Dashboard/TextEditorPopover';

import { DataSourceVariable } from '../../dashboard/dataSources/types';
import { useDataSourceVariables } from '../../dashboard/dataSources/useDataSourceVariables';
import { DataSourceVariablesExplorer } from '../Editor/DataSourceVariablesExplorer';

const ConditionalDiv = styled.div`
  background-color: ${({ theme }) => theme.colors.gray[4]};

  .else-button {
    display: none;
    color: #666;
    cursor: pointer;
  }

  &.active,
  &:hover {
    .else-button {
      display: inline-block;
    }
  }
`;

export function ConditionalEditor({
  attributes,
  children,
  element,
}: {
  attributes?: Record<string, unknown>;
  children: React.ReactNode;
  element: ConditionalElement;
}) {
  const variables = useDataSourceVariables();
  const selected = useSelected();
  const focused = useFocused();
  const editor = useSlate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const path = ReactEditor.findPath(editor, element);

  // TODO: tab management

  const [variableSearch, setVariableSearch] = useState('');
  const [dataSourcePopoverIsOpen, setDataSourcePopoverIsOpen] = useState(false);

  const updateCondition = (
    condition: Partial<ConditionalElement['condition']>
  ) => {
    Transforms.setNodes<ConditionalElement>(
      editor,
      {
        condition: {
          ...(element.condition || {
            dataSource: null,
            operation: null,
            value: null,
          }),
          ...condition,
        },
      },
      { at: path }
    );
  };

  const onSelectVariable = (variable: DataSourceVariable) => {
    // setInputFocused(false);
    updateCondition({
      dataSource: {
        dataSourceId: variable.dataSourceId,
        outputId: 'TODO',
      },
    });
    setDataSourcePopoverIsOpen(false);
  };

  const addElse = () => {
    Transforms.insertNodes<ConditionalElement>(
      editor,
      {
        type: 'conditional',
        isChained: true,
        condition: null,
        children: [{ text: '' }],
      },
      { at: Path.next(path) }
    );
  };

  let left = 0,
    top = 0;
  if (buttonRef.current && dataSourcePopoverIsOpen) {
    const rect = buttonRef.current.getBoundingClientRect();
    left = rect.left;
    top = rect.bottom;
  }

  const nextPath = Path.next(path);
  const nextNode = Node.has(editor, nextPath)
    ? Node.get(editor, nextPath)
    : null;
  const hasSubsequentConditional =
    Element.isElement(nextNode) &&
    nextNode.type === 'conditional' &&
    nextNode.isChained;

  return (
    <ConditionalDiv
      className={classNames({ active: selected && focused })}
      {...attributes}
    >
      <div contentEditable={false}>
        {element.isChained ? '} else if' : 'if'}{' '}
        <SecondaryButton
          ref={buttonRef}
          onClick={() => setDataSourcePopoverIsOpen(true)}
        >
          {element.condition?.dataSource ? (
            `{${element.condition.dataSource.dataSourceId}:${element.condition.dataSource.outputId}}`
          ) : (
            <FontAwesomeIcon icon={faEdit} />
          )}
        </SecondaryButton>
        <select
          value={element.condition?.operation || ''}
          onChange={(e) => {
            updateCondition({ operation: e.target.value });
          }}
        >
          <option>=</option>
          <option>{'>'}</option>
          <option>{'<'}</option>
        </select>
        <input
          value={element.condition?.value || ''}
          onChange={(e) => {
            updateCondition({ value: e.target.value });
          }}
        />
        {' {'}
        <TextEditorPopover
          isOpen={dataSourcePopoverIsOpen}
          left={left}
          top={top}
          onChangeIsOpen={(isOpen) => setDataSourcePopoverIsOpen(isOpen)}
        >
          <DataSourceVariablesExplorer
            onSelectVariable={onSelectVariable}
            textFilterValue={variableSearch}
            onChangeTextFilterValue={(value: string) => {
              setVariableSearch(value);
            }}
            shouldShowSearch={true}
            variables={variables}
          />
        </TextEditorPopover>
      </div>
      <div style={{ paddingLeft: '10px' }}>{children}</div>
      {!hasSubsequentConditional && (
        <div contentEditable={false}>
          {'} '}
          <span className="else-button" onClick={addElse}>
            else…
          </span>
        </div>
      )}
    </ConditionalDiv>
  );
}

export function ConditionValue() {
  return <div>TODO</div>;
}
