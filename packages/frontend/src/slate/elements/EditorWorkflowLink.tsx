import { ReactNode } from 'react';

import { faFileInvoice } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Element, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import {
  SlateElementAttributes,
  WorkflowLinkElement,
} from '@kenchi/slate-tools/lib/types';
import { linkStyle } from '@kenchi/ui/lib/Text';

import { trackEvent } from '../../utils/analytics';
import useWorkflow from '../../workflow/useWorkflow';
import { ElementWithPopover } from '../Editor/ElementWithPopover';
import { SelectedElementPopoverContent } from '../Editor/SelectedElementPopoverContent';
import { useIsOnlyElementSelected } from '../Editor/useIsOnlyElementSelected';

type Props = {
  attributes: SlateElementAttributes;
  children: ReactNode;
  element: WorkflowLinkElement;
  onClickEdit: () => void;
};
export const EditorWorkflowLink = ({
  attributes,
  children,
  element,
  onClickEdit,
}: Props) => {
  const { workflow: staticId } = element;
  const { loading, error, workflow } = useWorkflow(staticId, 'cache-first');
  const editor = useSlate();
  const isOnlyElementSelected = useIsOnlyElementSelected(element);

  let href, name;
  if (workflow) {
    href = `/playbooks/${workflow.staticId}`;
    name = workflow.name;
  } else if (error) {
    name = 'Error loading';
  } else if (loading) {
    name = 'Loading...';
  } else {
    name = 'Playbook not found';
  }

  const icon = (
    <FontAwesomeIcon
      icon={faFileInvoice}
      size="sm"
      style={{ opacity: '0.7' }}
    />
  );
  const body = (
    <>
      {icon} <span>{name}</span>
    </>
  );

  return (
    <ElementWithPopover
      shouldShowPopoverIfSelected={isOnlyElementSelected}
      popoverContent={
        <SelectedElementPopoverContent
          onClickRemove={() => {
            trackEvent({
              category: 'workflow_editor',
              action: 'remove_workflow_link',
              label: 'Remove workflow link',
            });
            Transforms.removeNodes(editor, {
              match: (n) => Element.isElement(n) && n.type === 'workflow-link',
            });
            ReactEditor.focus(editor);
          }}
          onClickEdit={onClickEdit}
          linkDisplayText={name}
          linkTo={href || ''}
        />
      }
    >
      <span
        {...attributes}
        contentEditable={false}
        css={(theme) => linkStyle(theme, { underline: false })}
      >
        {body}
        {children}
      </span>
    </ElementWithPopover>
  );
};
