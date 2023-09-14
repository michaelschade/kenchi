import { ReactNode } from 'react';

import { css } from '@emotion/react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { KenchiTheme } from '../Colors';

type PropsForTextEditorPopover = {
  top: number;
  left: number;
  isOpen: boolean;
  onChangeIsOpen: (isOpen: boolean) => void;
  children: ReactNode;
};

export const TextEditorPopover = ({
  top,
  left,
  isOpen,
  onChangeIsOpen,
  children,
}: PropsForTextEditorPopover) => {
  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={onChangeIsOpen}>
      <PopoverPrimitive.Anchor
        css={css`
          position: fixed;
          top: ${top}px;
          left: ${left}px;
        `}
      />
      <PopoverPrimitive.Content
        align="start"
        alignOffset={0}
        sideOffset={4}
        css={({ colors }: KenchiTheme) => css`
          border: 1px solid ${colors.gray[6]};
          box-shadow: 0 0 0.25rem 0 ${colors.subtleShadow};
          background-color: ${colors.gray[3]};
          color: ${colors.gray[11]};
          font-size: 0.95rem;
        `}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
