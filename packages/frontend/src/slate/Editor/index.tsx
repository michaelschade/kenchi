import { useCallback, useEffect, useRef, useState } from 'react';

import { ApolloClient, useApolloClient } from '@apollo/client';
import { css } from '@emotion/react';
import isHotkey from 'is-hotkey';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';

import { ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';

import { DataSourceVariable } from '../../dashboard/dataSources/types';
import Element from '../elements/Element';
import Leaf from '../elements/Leaf';
import {
  DataSourceVariablesPopover,
  DataSourceVariablesPopoverRef,
} from './DataSourceVariablesPopover';
import { SlashCommands, SlashCommandsRef } from './SlashCommands';
import { Toolbar } from './Toolbar';
import withCollapsible, {
  Toolbar as CollapsibleToolbar,
} from './withCollapsible';
import withFormatting, {
  onKeyDown as formattingOnKeyDown,
  Toolbar as FormattingToolbar,
} from './withFormatting';
import withImages, { ImageDropHandler, registerEditor } from './withImages';
import withKenchiElements, {
  Toolbar as KenchiElementsToolbar,
} from './withKenchiElements';
import withLinks, {
  LinksRef,
  onKeyDown as linksOnKeyDown,
  Toolbar as LinksToolbar,
} from './withLinks';
import withLists, {
  onKeyDown as listsOnKeyDown,
  Toolbar as ListsToolbar,
} from './withLists';
import withPasting from './withPasting';
import withShortcuts from './withShortcuts';
import withVariables, { Variables, VariablesRef } from './withVariables';
import withVoidWrappers, {
  onCopy as voidWrappersOnCopy,
  onCut as voidWrappersOnCut,
} from './withVoidWrappers';
import withWidgetEditing from './withWidgetEditing';

const singleLineCss = css`
  white-space: pre !important;
  overflow-x: scroll !important;
  overflow-y: hidden !important;

  ::-webkit-scrollbar {
    display: none;
  }
`;

const disabledCss = css`
  cursor: default;
  pointer-events: none;
  opacity: 0.65;
`;

export const insertTextEditorStyle = css`
  p {
    margin-bottom: 0;
  }
`;

type EditorFeatures = {
  withImages?: boolean;
  withKenchiElements?: { defaultCollectionId?: string | undefined };
  withFormattingForInsert?: boolean;
  withFormatting?: boolean;
  withCollapsible?: boolean;
  withWorkflowLinks?: boolean;
  withURLLinks?: boolean;
  withSlashCommands?: boolean;

  variables?: ToolInput[];
  dataSourceVariables?: Record<string, DataSourceVariable>;
};

export type EditorProps = {
  singleLine?: boolean;
  value: SlateNode[];
  size: 'small' | 'large';
  onChange: (value: SlateNode[]) => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
  spellCheck?: boolean;
  placeholder?: string;
  disabled?: boolean;
} & EditorFeatures;

export function getEditor(
  features: EditorFeatures,
  client: ApolloClient<object> | null,
  initialEditor = createEditor()
) {
  let editor: ReactEditor = withReact(withHistory(initialEditor));
  editor = withPasting(editor, client, features.withFormattingForInsert);
  editor = withVoidWrappers(editor);
  if (features.withFormatting || features.withFormattingForInsert) {
    editor = withFormatting(editor);
    editor = withShortcuts(editor);
    editor = withLists(editor);
  }
  if (features.withURLLinks || features.withWorkflowLinks) {
    editor = withLinks(editor);
  }
  if (features.withKenchiElements) {
    editor = withKenchiElements(editor);
  }
  if (features.variables) {
    editor = withVariables(editor);
  }
  if (features.dataSourceVariables) {
    editor = withWidgetEditing(editor);
  }
  if (features.withImages) {
    // Client is nullable for tests
    if (!client) {
      throw new Error('Cannot handle image uploads without an Apollo Client');
    }
    editor = withImages(editor, client);
  }
  if (features.withCollapsible) {
    editor = withCollapsible(editor);
  }
  return editor;
}

const Editor = ({
  singleLine,
  value,
  onChange,
  onBlur,
  style,
  spellCheck,
  placeholder,
  disabled,
  size,
  ...features
}: EditorProps) => {
  const client = useApolloClient();
  const linksRef = useRef<LinksRef>(null);
  const renderElement = useCallback(
    (props) => (
      <Element
        {...props}
        voidWrap={true}
        onClickEditLink={() => linksRef.current?.openModal()}
      />
    ),
    []
  );
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const [editor] = useState(() => getEditor(features, client));
  useEffect(() => {
    if (features.withImages) {
      return registerEditor(editor);
    }
  }, [editor, features.withImages]);

  const variablesRef = useRef<VariablesRef>(null);
  const dataSourceVariablesPopoverRef =
    useRef<DataSourceVariablesPopoverRef>(null);
  const slashCommandsRef = useRef<SlashCommandsRef>(null);

  const styles = [];
  styles.push(
    ({ colors }: KenchiTheme) => css`
      background-color: ${colors.gray[0]};
      color: ${colors.gray[12]};
    `
  );
  if (singleLine) {
    styles.push(singleLineCss);
  } else {
    styles.push(css`
      padding: 0.5rem;
    `);
  }

  if (features.withFormattingForInsert) {
    styles.push(insertTextEditorStyle);
  }
  if (disabled) {
    styles.push(disabledCss);
    styles.push(css`
      background-color: hsl(210deg 16% 93%);
    `);
  }

  const withFormatting =
    features.withFormatting || features.withFormattingForInsert;
  const withLinks = features.withURLLinks || features.withWorkflowLinks;

  const toolbar = [];
  if (withFormatting) {
    toolbar.push(<FormattingToolbar key="formatting" />);
  }
  if (withLinks) {
    toolbar.push(
      <LinksToolbar
        key="links"
        ref={linksRef}
        supportsWorkflowLinks={!!features.withWorkflowLinks}
        supportsUrlLinks={!!features.withURLLinks}
      />
    );
  }
  if (withFormatting) {
    toolbar.push(<ListsToolbar key="lists" size={size} />);
  }
  if (features.withCollapsible) {
    toolbar.push(<CollapsibleToolbar key="collapsible" size={size} />);
  }
  if (features.withKenchiElements) {
    toolbar.push(
      <KenchiElementsToolbar
        key="elements"
        {...features.withKenchiElements}
        size={size}
      />
    );
  }

  // Need position relative for the placement of the file upload drop box
  return (
    <div style={{ position: 'relative' }}>
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => {
          onChange(value as SlateNode[]);
        }}
      >
        {features.withImages && <ImageDropHandler />}
        {toolbar.length > 0 && <Toolbar disabled={disabled}>{toolbar}</Toolbar>}
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          css={styles}
          onCut={(event) => {
            voidWrappersOnCut(editor, event);
          }}
          onCopy={(event) => {
            voidWrappersOnCopy(editor, event);
          }}
          onKeyDown={(event) => {
            if (singleLine && isHotkey('enter', event as any)) {
              event.preventDefault();
            }
            if (withFormatting) {
              formattingOnKeyDown(editor, event);
              listsOnKeyDown(editor, event);
            }
            if (withLinks && linksRef.current) {
              linksOnKeyDown(linksRef.current, event);
            }
            if (variablesRef.current) {
              variablesRef.current.onKeyDown(event);
            }
            if (dataSourceVariablesPopoverRef.current) {
              dataSourceVariablesPopoverRef.current.onKeyDown(event);
            }
            if (slashCommandsRef.current) {
              slashCommandsRef.current.onKeyDown(event);
            }
          }}
          onBlur={onBlur}
          style={style}
          spellCheck={spellCheck}
          placeholder={placeholder}
          scrollSelectionIntoView={(editor, newDomRange) => {
            const el = ReactEditor.toDOMNode(editor, editor);
            const cursor = newDomRange.getBoundingClientRect();
            const input = el.getBoundingClientRect();
            if (cursor.left < input.left) {
              el.scrollBy(cursor.left - input.left, 0);
            } else if (cursor.right > input.right) {
              el.scrollBy(cursor.right - input.right + 1, 0);
            }

            const leafEl = newDomRange.startContainer.parentElement!;
            leafEl.scrollIntoView({ block: 'nearest' });
          }}
        />
        {features.variables && (
          <Variables variables={features.variables} ref={variablesRef} />
        )}
        {features.dataSourceVariables && (
          <DataSourceVariablesPopover
            variables={features.dataSourceVariables}
            ref={dataSourceVariablesPopoverRef}
          />
        )}
        {features.withSlashCommands && <SlashCommands ref={slashCommandsRef} />}
      </Slate>
    </div>
  );
};

export default Editor;
