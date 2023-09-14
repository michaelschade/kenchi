import { ReactNode, useEffect, useRef } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

import { DangerButton, PrimaryButton, SecondaryButton } from './Button';
import { commonDialogStyles, overlayStyles } from './Dialog';

const ButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
`;

type ConfirmDialogProps = {
  description: ReactNode;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange: (isOpen: boolean) => void;
  textForConfirmButton?: string;
  dangerous?: boolean;
};

const ConfirmDialog = ({
  description,
  isOpen,
  onConfirm,
  onCancel,
  onOpenChange,
  textForConfirmButton,
  dangerous,
}: ConfirmDialogProps) => {
  const confirmButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        // I'm not sure why we seem to need to wait for next tick here, but without
        // this timeout confirmButton.current is null instead of the button element.
        confirmButton.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const preventRadixAutoFocus = (event: Event) => {
    // By default, Radix will focus the first focusable element in the dialog, which
    // in our case is the cancel button. We instead want to focus the _second_
    // focusable element: the confirm button.
    event.preventDefault();
  };

  const ConfirmButton = dangerous ? DangerButton : PrimaryButton;

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay css={overlayStyles}>
          <AlertDialog.Content
            aria-label="confirm"
            onOpenAutoFocus={preventRadixAutoFocus}
            css={[
              commonDialogStyles,
              css`
                max-width: min(85%, 500px);
                padding: 1rem;
                top: 10rem;
              `,
            ]}
          >
            <AlertDialog.Description>{description}</AlertDialog.Description>
            <ButtonsContainer>
              <AlertDialog.Cancel asChild>
                <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <ConfirmButton ref={confirmButton} onClick={onConfirm}>
                  {textForConfirmButton || 'Confirm'}
                </ConfirmButton>
              </AlertDialog.Action>
            </ButtonsContainer>
          </AlertDialog.Content>
        </AlertDialog.Overlay>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default ConfirmDialog;
