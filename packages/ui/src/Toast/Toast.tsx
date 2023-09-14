import { ReactNode, useState } from 'react';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as ToastPrimitive from '@radix-ui/react-toast';

const TOAST_HIDE_MS = 400;

export enum ToastKindEnum {
  Success = 'success',
}

export type ToastConfig = {
  message: ReactNode;
  kind?: ToastKindEnum;
};

const Crust = styled(ToastPrimitive.Root)`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.gray[0]};
  border-radius: 0.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[4]};
  box-shadow: 0 0.5rem 1.5rem -0.5rem ${({ theme }) => theme.colors.toastShadow};
  display: grid;
  grid-template-columns: 1fr auto;
  height: 5rem;
  margin: 0 0 1.5rem 0;
  padding: 0 1rem;
  width: 18rem;

  &:before {
    // This hides the bullets we show for all ordered list items due
    // to some css in index.css
    // TODO: remove that from index.css, apply it some other way
    display: none;
  }

  @keyframes hide {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
      pointer-events: none;
      height: 4rem;
      margin-bottom: 1.5rem;
    }
    100% {
      opacity: 0;
      height: 0;
      margin-bottom: 0;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(calc(25% + 1rem));
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes swipeOut {
    from {
      transform: translateX(var(--radix-toast-swipe-end-x));
    }
    to {
      transform: translateX(calc(100% + 1rem));
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    &[data-state='open'] {
      animation: slideIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    &[data-state='closed'] {
      animation: hide ${TOAST_HIDE_MS}ms ease-in forwards;
    }
    &[data-swipe='move'] {
      transform: translateX(var(--radix-toast-swipe-move-x));
    }
    &[data-swipe='cancel'] {
      transform: translateX(0);
      transition: transform 200ms ease-out;
    }
    &[data-swipe='end'] {
      animation: swipeOut 100ms ease-out forwards;
    }
  }
`;

type ToastProps = ToastConfig & {
  onAfterClose: () => void;
};

export const Toast = ({
  message,
  onAfterClose,
  kind = ToastKindEnum.Success,
}: ToastProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const {
    colors: { green },
  } = useTheme();
  return (
    <Crust
      open={isOpen}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        if (!isOpen) {
          setTimeout(() => {
            onAfterClose();
          }, TOAST_HIDE_MS);
        }
      }}
    >
      <ToastPrimitive.Description>{message}</ToastPrimitive.Description>
      {kind === ToastKindEnum.Success && (
        <FontAwesomeIcon icon={faCheckCircle} color={green[9]} />
      )}
    </Crust>
  );
};
