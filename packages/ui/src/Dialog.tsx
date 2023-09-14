import { css } from '@emotion/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import classNames from 'classnames';
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
  justify-items: center;
  opacity: 0;
  overflow-y: auto;
  padding-bottom: 4rem;
  position: fixed;
  transition: opacity 0.3s ease-in-out;
`;

const dialogWidths = {
  extension: css`
    width: 280px;
  `,
  small: tw`max-w-xl`,
  medium: tw`max-w-3xl`,
  large: tw`max-w-6xl`,
};

// These styles are shared with other types of dialogs, like ConfirmDialog
export const commonDialogStyles = ({ colors }: KenchiTheme) => css`
  @keyframes content-open {
    from {
      transform: translateY(1rem);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes content-close {
    from {
      opacity: 1;
    }
    to {
      transform: scale(0.95);
      opacity: 0;
    }
  }

  &[data-state='open'] {
    animation: content-open 0.3s ease;
  }
  &[data-state='closed'] {
    animation: content-close 0.3s ease;
  }

  background-color: ${colors.gray[1]};
  border-radius: 0.25rem;
  border: 1px solid ${colors.gray[6]};
  position: relative;

  top: 4rem;
  .hud & {
    top: 2rem;
  }

  ${tw`shadow-2xl`}
`;

const dialogStyles = ({ colors }: KenchiTheme) => css`
  margin-bottom: 4rem;
  .hud & {
    margin-bottom: 2rem;
  }

  width: 100%;

  &,
  > form {
    > .DialogHeader {
      /* workaround lack of tailwind preflight */
      ${tw`border-solid border-0`}

      ${tw`p-4 border-b-2`}
      border-color: ${colors.gray[6]};
      background-color: ${colors.gray[1]};
      h1 {
        ${tw`text-xl font-medium leading-normal`}
        color: ${colors.gray[12]};
      }
      h2 {
        ${tw`text-lg font-medium leading-normal`}
        color: ${colors.gray[12]};
      }
      h3 {
        ${tw`text-base font-medium leading-normal`}
        color: ${colors.gray[11]};
      }
      h4 {
        ${tw`text-sm font-medium leading-normal`}
        color: ${colors.gray[11]};
      }
    }
    > .DialogContent {
      ${tw`p-4`}
      background-color: ${colors.gray[1]};
    }
    > .DialogFooter {
      ${tw`px-4 py-3 flex justify-end`}
      background-color: ${colors.gray[3]};
    }
  }
`;

export type DialogProps = {
  width?: 'small' | 'medium' | 'large' | 'extension';
  isOpen: boolean;
  onClose?: () => void;
};

export const Dialog: React.FC<DialogProps> = ({
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
          <DialogPrimitive.Content
            css={[commonDialogStyles, dialogStyles, dialogWidths[width]]}
          >
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={classNames('DialogHeader', className)} {...props} />
);

export const DialogContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={classNames('DialogContent', className)} {...props} />
);

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={classNames('DialogFooter', className)} {...props} />
);
