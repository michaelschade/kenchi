import { useCallback, useEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Editor, Node, Range } from 'slate';
import { useSlateStatic } from 'slate-react';
import tw from 'twin.macro';

import {
  LinkElement,
  WorkflowLinkElement,
} from '@kenchi/slate-tools/lib/types';
import { PrimaryButton, SecondaryButton } from '@kenchi/ui/lib/Button';
import { Form, InputGroup } from '@kenchi/ui/lib/Form';

import { CustomModal } from '../../components/Modals';
import {
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../../graphql/generated';
import { ObjectTypeEnum } from '../../search/filter';
import { EMAIL_REGEX, safeURL } from '../../utils';
import { trackEvent } from '../../utils/analytics';
import KenchiElementModal from './KenchiElementModal';

const hrTextStyle = css`
  line-height: 1em;
  position: relative;
  outline: 0;
  border: 0;
  text-align: center;
  height: 1.5em;
  &:before {
    content: '';
    // use the linear-gradient for the fading effect
    // use a solid background color for a solid bar
    background: linear-gradient(to right, transparent, #818078, transparent);
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
  }
  &:after {
    content: attr(data-content);
    position: relative;
    display: inline-block;
    color: black;

    padding: 0 0.5em;
    line-height: 1.5em;
    // this is really the only tricky part, you need to specify the background color of the container element...
    color: #6c757d;
    background-color: rgba(247, 251, 255, 1);
  }
`;

type TextLinkModalProps = {
  withWorkflow: boolean;
  withUrl: boolean;
  initialNode: LinkElement | WorkflowLinkElement | null;
  editorSelection?: Range;
  onUrlSubmit(urlText: string, fixedUrl: string, url: string): void;
  onClose(): void;
  addWorkflow(
    editor: Editor,
    item: ToolListItemFragment | WorkflowListItemFragment
  ): void;
  onClickRemove(): void;
  isOpen: boolean;
};

export default function TextLinkModal({
  withWorkflow,
  withUrl,
  initialNode,
  editorSelection,
  onUrlSubmit,
  onClose,
  addWorkflow,
  onClickRemove,
  isOpen,
}: TextLinkModalProps) {
  const editor = useSlateStatic();

  const [url, setUrl] = useState('');
  const [urlText, setUrlText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setUrl(initialNode?.type === 'link' ? initialNode.url : '');
    setUrlText(
      initialNode
        ? Node.string(initialNode)
        : editorSelection
        ? Editor.string(editor, editorSelection)
        : ''
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const [validationError, setValidationError] = useState(false);

  const onSubmitTextLinkForm = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      setValidationError(false);
      let fixedUrl: string | null = url;

      const parsedUrl = safeURL(url);
      if (!parsedUrl) {
        if (EMAIL_REGEX.test(url)) {
          fixedUrl = `mailto:${url}`;
        } else {
          fixedUrl = `http://${url}`;
          if (!safeURL(fixedUrl)) {
            setValidationError(true);
            fixedUrl = null;
          }
        }
      }

      if (fixedUrl) {
        onUrlSubmit(urlText, fixedUrl, url);
      }
    },
    [url, urlText, onUrlSubmit]
  );

  const onBack = useCallback(() => {
    trackEvent({
      category: 'workflow_editor',
      action: `cancel_modal_insert_links`,
      label: `Close modal to insert links without inserting anything`,
    });
    onClose();
  }, [onClose]);

  const shouldShowUrlAndWorkflowLinkOptions = withWorkflow && !initialNode;
  const shouldShowOnlyWorkflowOption =
    withWorkflow && initialNode?.type === 'workflow-link';

  const urlLinkForm = withUrl && (
    <Form onSubmit={onSubmitTextLinkForm}>
      <InputGroup
        value={urlText}
        placeholder="Text"
        onChange={(e) => setUrlText(e.target.value)}
      />
      <InputGroup
        autoFocus
        error={validationError ? 'Invalid URL' : ''}
        value={url}
        placeholder="URL"
        onChange={(e) => {
          setValidationError(false);
          setUrl(e.target.value);
        }}
      />
      <div>
        <div css={tw`grid gap-2`}>
          <PrimaryButton type="submit" block>
            {initialNode ? 'Update link' : 'Create link'}
          </PrimaryButton>
          {initialNode && (
            <SecondaryButton block onClick={onClickRemove}>
              Remove link
            </SecondaryButton>
          )}
        </div>
        {shouldShowUrlAndWorkflowLinkOptions && (
          <hr css={hrTextStyle} data-content="or link to a playbook" />
        )}
      </div>
    </Form>
  );

  if (shouldShowUrlAndWorkflowLinkOptions) {
    return (
      <KenchiElementModal
        isOpen={isOpen}
        itemName="playbook"
        field="links"
        requireSearching={true}
        searchFilters={{
          type: ObjectTypeEnum.playbook,
        }}
        addItem={addWorkflow}
        insertText="Insert link"
        onClose={onClose}
        isWide={false}
      >
        {urlLinkForm}
      </KenchiElementModal>
    );
  } else if (shouldShowOnlyWorkflowOption) {
    return (
      <KenchiElementModal
        isOpen={isOpen}
        currentItemStaticId={
          initialNode?.type === 'workflow-link'
            ? initialNode.workflow
            : undefined
        }
        itemName="playbook"
        field="links"
        requireSearching={true}
        searchFilters={{
          type: ObjectTypeEnum.playbook,
        }}
        addItem={addWorkflow}
        insertText="Edit playbook link"
        onClose={onClose}
        onClickRemove={onClickRemove}
        textForRemoveButton="Remove link"
        isWide={false}
      />
    );
  } else {
    return (
      <CustomModal isOpen={isOpen} onBack={onBack} title="Edit link">
        {urlLinkForm}
      </CustomModal>
    );
  }
}
