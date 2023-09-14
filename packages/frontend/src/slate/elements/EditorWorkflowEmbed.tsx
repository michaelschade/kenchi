import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Element, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { WorkflowEmbedElement } from '@kenchi/slate-tools/lib/types';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';

import { trackEvent } from '../../utils/analytics';
import useWorkflow from '../../workflow/useWorkflow';
import { ElementWithPopover } from '../Editor/ElementWithPopover';
import { SelectedElementPopoverContent } from '../Editor/SelectedElementPopoverContent';
import { useIsOnlyElementSelected } from '../Editor/useIsOnlyElementSelected';
import Renderer from '../Renderer';
import { PointerEventsBlocker } from './utils/PointerEventsBlocker';

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.gray[1]};
  border-radius: 0.25rem;
  border: 1px dotted ${({ theme }) => theme.colors.accent[11]};
  margin: 1rem 0.25rem 0.25rem 0.25rem;
  padding: 1rem 0.5rem 0.5rem 0.5rem;
  position: relative;
  user-select: none;

  div {
    opacity: 0.85;
  }
`;

const embedBadgeStyle = ({ colors }: KenchiTheme) => css`
  color: ${colors.gray[1]};
  background-color: ${colors.accent[9]};
  position: absolute;
  top: -10px;
  left: 10px;
  font-weight: 400;

  /* from bootstrap */
  display: inline-block;
  padding: 0.25em 0.4em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
`;

function EmbedBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge" css={embedBadgeStyle}>
      {children}
    </span>
  );
}

type EditorWorkflowEmbedProps = {
  element: WorkflowEmbedElement;
};

export const EditorWorkflowEmbed = ({ element }: EditorWorkflowEmbedProps) => {
  const { workflow: staticId } = element;
  const { loading, error, workflow } = useWorkflow(staticId);
  const editor = useSlate();
  const isOnlyElementSelected = useIsOnlyElementSelected(element);

  let name = null;
  let contents = null;
  if (workflow) {
    name = workflow.name;
    if (!workflow.contents) {
      throw new Error('Missing playbook contents');
    }
    contents = <Renderer contents={workflow.contents} />;
  } else if (error) {
    name = 'Error loading embed';
  } else if (loading) {
    name = 'Loading...';
  } else {
    name = 'Embed not found';
    contents = 'You may not have permission to view this embedded playbook.';
  }

  return (
    <ElementWithPopover
      shouldShowPopoverIfSelected={isOnlyElementSelected}
      popoverContent={
        <SelectedElementPopoverContent
          onClickRemove={() => {
            trackEvent({
              category: 'workflow_editor',
              action: 'remove_workflow_embed',
              label: 'Remove workflow embed',
            });
            Transforms.removeNodes(editor, {
              match: (n) => Element.isElement(n) && n.type === 'workflow-embed',
            });
            ReactEditor.focus(editor);
          }}
          linkDisplayText={name}
          linkTo={`/dashboard/playbooks/${staticId}`}
        />
      }
      elementIsInline={false}
    >
      <Wrapper className="edit-mode">
        <PointerEventsBlocker />
        <EmbedBadge>{name}</EmbedBadge>
        {contents}
      </Wrapper>
    </ElementWithPopover>
  );
};
