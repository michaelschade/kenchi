import { useCallback, useState } from 'react';

import tw from 'twin.macro';

import { ImageElement } from '@kenchi/slate-tools/lib/types';
import { PrimaryButton, SecondaryButton } from '@kenchi/ui/lib/Button';
import { Form, InputGroup } from '@kenchi/ui/lib/Form';

import { CustomModal } from '../../components/Modals';
import { EMAIL_REGEX, safeURL } from '../../utils';
import { trackEvent } from '../../utils/analytics';

type ImageLinkModalProps = {
  initialNode: ImageElement | null;
  onUrlSubmit(fixedUrl: string): void;
  onClose(): void;
  onClickRemove(): void;
  isOpen: boolean;
};

export default function ImageLinkModal({
  initialNode,
  onUrlSubmit,
  onClose,
  onClickRemove,
  isOpen,
}: ImageLinkModalProps) {
  const [url, setUrl] = useState(initialNode?.href || '');
  const [validationError, setValidationError] = useState(false);
  const imageHasLink = !!initialNode?.href;

  const onSubmitImageLinkForm = useCallback(
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
        onUrlSubmit(fixedUrl);
      }
    },
    [url, onUrlSubmit]
  );

  const onBack = useCallback(() => {
    trackEvent({
      category: 'workflow_editor',
      action: `cancel_modal_insert_links`,
      label: `Close modal to insert links without inserting anything`,
    });
    onClose();
  }, [onClose]);

  const urlLink = (
    <Form onSubmit={onSubmitImageLinkForm}>
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
      <div css={tw`grid gap-2`}>
        <PrimaryButton type="submit" block>
          {imageHasLink ? 'Update link' : 'Create link'}
        </PrimaryButton>
        {imageHasLink && (
          <SecondaryButton type="button" onClick={onClickRemove} block>
            Remove link
          </SecondaryButton>
        )}
      </div>
    </Form>
  );

  return (
    <CustomModal isOpen={isOpen} onBack={onBack} title="Link image">
      {urlLink}
    </CustomModal>
  );
}
