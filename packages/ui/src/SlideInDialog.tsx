import { css } from '@emotion/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import tw from 'twin.macro';

import { KenchiTheme } from './Colors';

export const overlayStyles = ({ colors }: KenchiTheme) => css`
  @keyframes overlay-open {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes overlay-close {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  &[data-state='closed'] {
    animation: overlay-close 0.3s ease;
  }

  align-items: start;
  animation: overlay-open 0.3s ease forwards;
  backdrop-filter: blur(2px);
  background-color: ${colors.fixed.dialogOverlay};
  display: grid;
  inset: 0;
  justify-items: end;
  opacity: 0;
  overflow-y: auto;
  position: fixed;
  transition: opacity 0.3s ease-in-out;
`;

export const slideInDialogStyles = ({ colors }: KenchiTheme) => css`
  @keyframes content-slide-in {
    from {
      transform: translateX(10rem);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes content-slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(10rem);
      opacity: 0;
    }
  }

  &[data-state='open'] {
    animation: content-slide-in 0.3s ease;
  }
  &[data-state='closed'] {
    animation: content-slide-out 0.3s ease;
  }

  background-color: ${colors.gray[1]};
  border-radius: 0.25rem;
  border: 1px solid ${colors.gray[6]};
  position: relative;
  height: 100%;
  ${tw`shadow-2xl`}

  // This no-op transform is needed because it makes the dialog act as the
  // containing block for elements with position: fixed, as in the
  // EditActionBarContainer
  transform: translate3d(0, 0, 0);
`;

type SlideInDialogProps = {
  width?: 'small' | 'medium' | 'large' | 'extension';
  isOpen: boolean;
  onClose?: () => void;
};

export const SlideInDialog: React.FC<SlideInDialogProps> = ({
  width = 'small',
  isOpen,
  onClose,
  children,
}) => {
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose?.();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay css={overlayStyles}>
          <DialogPrimitive.Content css={slideInDialogStyles}>
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
