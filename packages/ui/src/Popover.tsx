import { SerializedStyles } from '@emotion/react';
import styled from '@emotion/styled';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as PopoverPrimitive from '@radix-ui/react-popover';

const popoverAnimationMs = 200;

const PopoverContent = styled(PopoverPrimitive.Content)`
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
  background-color: ${({ theme }) => theme.colors.gray[1]};
  filter: drop-shadow(0px 0px 1px ${({ theme }) => theme.colors.gray[8]});
  border-radius: 0.25rem;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
  color: ${({ theme }) => theme.colors.gray[12]};
  padding: 0.5rem;
  transform-origin: var(--radix-popover-content-transform-origin);
  &[data-state='open'] {
    animation: fadeIn ${popoverAnimationMs}ms ease-out;
  }
  &[data-state='closed'] {
    animation: fadeOut ${popoverAnimationMs}ms ease-in;
  }
`;

const PopoverArrow = styled(PopoverPrimitive.Arrow)`
  fill: ${({ theme }) => theme.colors.gray[1]};
`;

const PopoverClose = styled(PopoverPrimitive.Close)`
  align-items: center;
  background-color: transparent;
  border-radius: 500px;
  border: none;
  color: ${({ theme }) => theme.colors.gray[10]};
  display: grid;
  height: 1.5rem;
  justify-content: center;
  position: absolute;
  right: 0.25rem;
  top: 0.25rem;
  transition: color 0.2s ease-in-out;
  width: 1.5rem;
  &:hover {
    color: ${({ theme }) => theme.colors.gray[12]};
  }
`;

type Placement = PopoverPrimitive.PopoverContentProps['side'];

type PopoverProps = {
  content: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  onClickClose?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  shouldFocusOnOpen?: boolean;
  shouldCloseOnInteractOutside?: boolean;
  shouldShowArrow?: boolean;
  shouldShowClose?: boolean;
  anchorCss?: SerializedStyles;
  placement?: Placement;
};

export function Popover({
  trigger,
  content,
  onClose,
  onClickClose,
  onOpenChange,
  isOpen,
  align = 'end',
  shouldFocusOnOpen = true,
  shouldShowArrow = true,
  shouldCloseOnInteractOutside = true,
  shouldShowClose = false,
  anchorCss,
  placement = 'bottom',
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose?.();
        }
        onOpenChange?.(isOpen);
      }}
    >
      {trigger && (
        <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      )}
      {!trigger && <PopoverPrimitive.Anchor css={anchorCss} />}
      <PopoverContent
        align={align}
        side={placement}
        sideOffset={5}
        onOpenAutoFocus={(e) => {
          if (!shouldFocusOnOpen) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (!shouldCloseOnInteractOutside) {
            e.preventDefault();
          }
        }}
      >
        {shouldShowArrow && (
          <PopoverArrow
            offset={align === 'center' ? 0 : 10}
            width={12}
            height={6}
          />
        )}
        {shouldShowClose && (
          <PopoverClose onClick={onClickClose}>
            <FontAwesomeIcon icon={faTimes} size="xs" />
          </PopoverClose>
        )}
        {content}
      </PopoverContent>
    </PopoverPrimitive.Root>
  );
}
