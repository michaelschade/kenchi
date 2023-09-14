import { useCallback, useState } from 'react';

import { css } from '@emotion/react';
import {
  faFileInvoice,
  faMagic,
  faPlusCircle,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import { Editor, Element, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { SlateElement } from '@kenchi/slate-tools/lib/types';

import { PageModal } from '../../components/Modals';
import {
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../../graphql/generated';
import { useHasSomeCollectionPermission } from '../../graphql/useSettings';
import { ObjectTypeEnum } from '../../search/filter';
import NewTool from '../../tool/edit/NewTool';
import { trackEvent } from '../../utils/analytics';
import { isTool, isWorkflow } from '../../utils/versionedNode';
import KenchiElementModal from './KenchiElementModal';
import { Button } from './Toolbar';
import useSelectModal from './useSelectModal';
import { isEmptyRecursive, isListItem } from './utils';

type KenchiElementProps = {
  defaultCollectionId?: string;
  size: 'small' | 'large';
};

export default function withKenchiElements(editor: ReactEditor) {
  const { isVoid } = editor;
  editor.isVoid = (n) =>
    n.type === 'workflow-embed' || n.type === 'tool' ? true : isVoid(n);
  return editor;
}

function insertTool(
  editor: Editor,
  tool: ToolListItemFragment | WorkflowListItemFragment
) {
  if (!isTool(tool)) {
    captureMessage('Trying to insert non-tool as tool', { extra: { tool } });
    return;
  }

  const newNode: SlateElement = {
    type: 'void-wrapper',
    children: [
      { type: 'void-spacer', children: [{ text: '' }] },
      { type: 'tool', tool: tool.staticId, children: [{ text: '' }] },
      { type: 'void-spacer', children: [{ text: '' }] },
    ],
  };
  const above = Editor.above(editor);

  Transforms.insertNodes(editor, newNode);
  if (above) {
    const [node, path] = above;
    if (isEmptyRecursive(editor, node)) {
      Transforms.removeNodes(editor, { at: path });
    }
  }

  trackEvent({
    category: 'workflow_editor',
    action: 'insert_tool',
    label: 'Insert tool into workflow editor',
    object: tool.staticId,
  });
}

function embedWorkflow(
  editor: Editor,
  workflow: ToolListItemFragment | WorkflowListItemFragment
) {
  if (!isWorkflow(workflow)) {
    captureMessage('Trying to insert non-workflow as embed', {
      extra: { workflow },
    });
    return;
  }

  const list = Editor.above(editor, { match: isListItem });
  const above = Editor.above(editor);

  let embed: Element = {
    type: 'void-wrapper',
    children: [
      { type: 'void-spacer', children: [{ text: '' }] },
      {
        type: 'workflow-embed',
        workflow: workflow.staticId,
        children: [{ text: '' }],
      },
      { type: 'void-spacer', children: [{ text: '' }] },
    ],
  };
  if (list) {
    embed = { type: 'list-item', children: [embed] };
    Transforms.insertNodes(editor, embed, { match: isListItem });
  } else {
    Transforms.insertNodes(editor, embed);
  }

  if (above) {
    const [node, path] = above;
    if (isEmptyRecursive(editor, node)) {
      Transforms.removeNodes(editor, { at: path });
    }
  }

  trackEvent({
    category: 'workflow_editor',
    action: 'insert_workflow',
    label: 'Insert embeddable workflow into workflow editor',
    object: workflow.staticId,
  });
}

const TextWithPlus = ({ text }: { text: string }) => (
  <>
    <FontAwesomeIcon icon={faPlusCircle} size="sm" />
    <span>{text}</span>
  </>
);

const iconPlusStyle = css`
  position: absolute;
  right: -8px;
  top: -1px;
  filter: brightness(0.6);
`;

const IconWithPlus = ({ icon }: { icon: IconDefinition }) => (
  <div style={{ position: 'relative' }}>
    <FontAwesomeIcon icon={faPlusCircle} size="xs" css={iconPlusStyle} />
    <FontAwesomeIcon icon={icon} size="sm" />
  </div>
);

const ToolButton = ({ defaultCollectionId, size }: KenchiElementProps) => {
  const editor = useSlate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const canPublish = useHasSomeCollectionPermission('publish_tool');

  const {
    show: showSelectModal,
    open: openSelectModal,
    close: closeSelectModal,
    onMouseDown,
  } = useSelectModal('tools');

  const closeCreateModal = useCallback(() => {
    trackEvent({
      category: 'workflow_editor',
      action: 'cancel_modal_create_tool',
      label: 'Close modal to create a new tool without creating anything',
    });
    setShowCreateModal(false);
  }, []);

  const onCreate = useCallback(
    (item) => {
      trackEvent({
        category: 'workflow_editor',
        action: 'create_tool_from_modal',
        label: 'Create new tool from the insert tool modal',
        object: item.staticId,
      });

      setShowCreateModal(false);
      closeSelectModal();
      insertTool(editor, item);
    },
    [editor, closeSelectModal]
  );

  const onNew = useCallback(() => {
    trackEvent({
      category: 'workflow_editor',
      action: 'open_modal_create_tool',
      label: 'Open modal to create a new tool',
    });
    setShowCreateModal(true);
  }, []);

  return (
    <>
      <PageModal isOpen={showCreateModal} onBack={closeCreateModal}>
        <NewTool
          topLevel={false}
          onBack={closeCreateModal}
          onCreate={onCreate}
          publishOnly={true}
          defaultCollectionId={defaultCollectionId}
        />
      </PageModal>

      <KenchiElementModal
        isOpen={!showCreateModal && showSelectModal}
        itemName="snippet"
        field="tools"
        searchFilters={{
          type: ObjectTypeEnum.snippet,
        }}
        addItem={insertTool}
        insertText="Insert snippet"
        onNew={canPublish ? onNew : undefined}
        onClose={closeSelectModal}
        isWide={size === 'large'}
      />
      <Button
        active={false}
        onClick={openSelectModal}
        onMouseDown={onMouseDown}
        tooltip="Insert snippet"
      >
        {size === 'large' ? (
          <TextWithPlus text="snippet" />
        ) : (
          <IconWithPlus icon={faMagic} />
        )}
      </Button>
    </>
  );
};

const WorkflowButton = ({ size }: { size: KenchiElementProps['size'] }) => {
  const {
    show: showSelectModal,
    open: openSelectModal,
    close: closeSelectModal,
    onMouseDown,
  } = useSelectModal('workflows');

  return (
    <>
      <KenchiElementModal
        isOpen={showSelectModal}
        itemName="playbook"
        field="workflows"
        searchFilters={{
          type: ObjectTypeEnum.playbook,
        }}
        addItem={embedWorkflow}
        insertText="Embed playbook"
        onClose={closeSelectModal}
        isWide={size === 'large'}
      />
      <Button
        active={false}
        onClick={openSelectModal}
        onMouseDown={onMouseDown}
        tooltip="Embed playbook"
      >
        {size === 'large' ? (
          <TextWithPlus text="playbook" />
        ) : (
          <IconWithPlus icon={faFileInvoice} />
        )}
      </Button>
    </>
  );
};

type ToolbarProps = {
  defaultCollectionId?: string;
  size: 'small' | 'large';
};

export const Toolbar = ({ defaultCollectionId, size }: ToolbarProps) => {
  return (
    <>
      <ToolButton size={size} defaultCollectionId={defaultCollectionId} />
      <WorkflowButton size={size} />
    </>
  );
};
