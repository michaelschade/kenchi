import { isValidElement } from 'react';

import { css } from '@emotion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { KenchiTheme } from './Colors';

export const DEFAULT_TOOLTIP_MOUSEENTER_DELAY_MS = 700;

const style = ({ colors }: KenchiTheme) => css`
  z-index: 1070;

  border-radius: 3px;
  color: ${colors.gray[1]};
  max-width: 190px;
  padding: 7px 9px;
  background-color: ${colors.gray[12]};
  box-shadow: 0px 1px 5px 0px ${colors.subtleShadow};

  overflow: hidden;
  text-overflow: clip;

  &,
  * {
    font-size: 0.7rem !important;
  }

  img {
    max-width: 180px;
  }
`;

const arrowStyle = ({ colors }: KenchiTheme) => css`
  fill: ${colors.gray[12]};
`;

export type Placement = TooltipPrimitive.TooltipContentProps['side'];

export type TooltipProps = {
  className?: string;
  placement?: Placement;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  mouseEnterDelay?: number;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

export default function Tooltip({
  className,
  children,
  overlay,
  placement = 'bottom',
  mouseEnterDelay = DEFAULT_TOOLTIP_MOUSEENTER_DELAY_MS,
  isOpen,
  onOpenChange,
}: TooltipProps) {
  let childrenNeedsWrapper = false;
  if (isValidElement(children)) {
    // FontAwesomeIcon interacts poorly with Trigger's asChild prop, possibly
    // because of some ref passing shenanigans. Removing `asChild` wraps the
    // element in an ugly button, so instead wrap it in a span that can handle
    // the ref passing properly. If we remove this the trigger won't work and
    // you'll see the warning "Function components cannot be given refs.
    // Attempts to access this ref will fail. Did you mean to use
    // React.forwardRef()?"
    if (children.type === FontAwesomeIcon) {
      childrenNeedsWrapper = true;
    } else if ('css' in children.props && 'icon' in children.props) {
      // If we use a `css` prop on the icon, the component gets wrapped in an
      // "EmotionCssPropInternal", but the bug remains. Infer based on the
      // presence of an icon prop that this is really a FontAwesomeIcon under
      // the hood.
      childrenNeedsWrapper = true;
    }
  }
  return (
    <TooltipPrimitive.Root
      delayDuration={mouseEnterDelay}
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <TooltipPrimitive.Trigger asChild className={className}>
        {childrenNeedsWrapper ? <span>{children}</span> : children}
      </TooltipPrimitive.Trigger>
      {overlay && (
        <TooltipPrimitive.Content
          css={style}
          side={placement}
          align="center"
          avoidCollisions={true}
        >
          {overlay}
          <TooltipPrimitive.Arrow
            css={arrowStyle}
            offset={5}
            width={11}
            height={5}
          />
        </TooltipPrimitive.Content>
      )}
    </TooltipPrimitive.Root>
  );
}
