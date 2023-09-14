import { forwardRef, HTMLProps } from 'react';

import { css } from '@emotion/react';
import classNames from 'classnames/bind';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import Tooltip from '@kenchi/ui/lib/Tooltip';

// Matches https://github.com/ccampbell/mousetrap/blob/2f9a476ba6158ba69763e4fcf914966cc72ef433/mousetrap.js#L135
const modKey = /Mac|iPod|iPhone|iPad/.test(globalThis.navigator?.platform)
  ? '⌘'
  : 'ctrl';

const buttonStyle = ({ colors }: KenchiTheme) => css`
  margin-right: 5px;
  padding: 0 3px;
  cursor: pointer;
  color: ${colors.gray[8]};
  transition: color 0.1s ease-in-out;

  &.disabled {
    cursor: default;
    &:hover {
      color: ${colors.gray[8]};
    }
  }

  &.active {
    color: ${colors.gray[11]};
  }

  &:hover {
    color: ${colors.accent[9]};
  }

  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 0.2em;

  > span {
    font-size: 0.95em;
  }
`;

type ButtonProps = {
  active: boolean;
  tooltip: string;
  shortcut?: string;
  disabled?: boolean;
} & Pick<
  HTMLProps<HTMLSpanElement>,
  'className' | 'children' | 'onMouseDown' | 'onClick'
>;

export const Button = forwardRef(
  (
    { active, tooltip, shortcut, className, disabled, ...props }: ButtonProps,
    ref: React.Ref<HTMLSpanElement>
  ) => {
    let tip = tooltip;
    if (shortcut) {
      tip += ` (${modKey}+${shortcut})`;
    }
    return (
      <Tooltip overlay={tip}>
        <span
          css={buttonStyle}
          className={classNames({ active, disabled }, className)}
          ref={ref}
          {...props}
        />
      </Tooltip>
    );
  }
);

const disabledStyle = css`
  cursor: default;
  pointer-events: none;
  opacity: 0.65;
`;

const toolbarStyle = ({ colors }: KenchiTheme) => css`
  padding: 0.25rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid ${colors.gray[5]};
  margin-bottom: 5px;
  margin-top: 1px; // So we don't squash the top border-radius
  position: sticky;
  top: 0;
  z-index: 98;
  background: ${colors.gray[0]};
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`;

type ToolbarProps = {
  children: React.ReactNode;
  disabled?: boolean;
};

export const Toolbar = forwardRef(
  ({ children, disabled }: ToolbarProps, ref: React.Ref<HTMLDivElement>) => {
    return (
      <div
        ref={ref}
        css={[toolbarStyle, disabled ? disabledStyle : null]}
        children={children}
      />
    );
  }
);
