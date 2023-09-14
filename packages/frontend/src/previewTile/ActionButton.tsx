import { forwardRef } from 'react';

import styled from '@emotion/styled';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';

import { BaseButton } from '@kenchi/ui/lib/Button';

export const Button = styled(BaseButton)`
  background-color: ${({ theme }) => theme.colors.gray[1]};
  font-size: 0.6em;
  font-weight: 700;
  padding: 1px 3px;

  &[disabled] {
    cursor: not-allowed;
    pointer-events: none;
  }

  svg {
    width: 1em;
  }

  &.blue {
    color: ${({ theme }) => theme.colors.accent[9]};
    border-color: ${({ theme }) => theme.colors.accent[9]};
  }

  &.green {
    color: ${({ theme }) => theme.colors.green[9]};
    border-color: ${({ theme }) => theme.colors.green[9]};
  }

  &.grey {
    color: ${({ theme }) => theme.colors.gray[9]};
    border-color: ${({ theme }) => theme.colors.gray[9]};
  }

  &:hover {
    &.blue {
      color: ${({ theme }) => theme.colors.accent[11]};
      border-color: ${({ theme }) => theme.colors.accent[11]};
    }

    &.green {
      color: ${({ theme }) => theme.colors.green[11]};
      border-color: ${({ theme }) => theme.colors.green[11]};
    }

    &.grey {
      color: ${({ theme }) => theme.colors.gray[11]};
      border-color: ${({ theme }) => theme.colors.gray[11]};
    }
  }

  /* Active is selected in the list or pressed. */
  .active &.action-primary,
  &:active,
  &.active {
    &.blue {
      color: ${({ theme }) => theme.colors.accent[1]};
      border-color: ${({ theme }) => theme.colors.accent[9]};
      background-color: ${({ theme }) => theme.colors.accent[9]};
    }

    &.green {
      color: ${({ theme }) => theme.colors.green[1]};
      border-color: ${({ theme }) => theme.colors.green[9]};
      background-color: ${({ theme }) => theme.colors.green[9]};
    }

    &.grey {
      color: ${({ theme }) => theme.colors.gray[1]};
      border-color: ${({ theme }) => theme.colors.gray[9]};
      background-color: ${({ theme }) => theme.colors.gray[9]};
    }
  }
`;

// ActionButton is a basic component can indicate running a tool, opening
// a menu (see MenuActionButton), etc.

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color: 'blue' | 'green' | 'grey';
  icon?: IconDefinition;
  label?: React.ReactNode;
  active?: boolean;
  primary?: boolean;
  onClick?: () => void;
};

function ActionButton(
  {
    active,
    children,
    className,
    color,
    icon,
    label,
    onClick,
    primary,
    ...props
  }: ActionButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  // rc-trigger inspects its direct children's props to avoid mistakenly
  // overwriting `onMouseDown` We usually put our onMouseDown handler on
  // <Button>, but need to insert it into the ActionButton `props` directly so
  // rc-trigger doesn't override it
  // (https://github.com/react-component/trigger/blob/e57f1492/src/index.tsx#L39-L48).
  props.onMouseDown = (e) => {
    if (!primary) {
      e.stopPropagation();
    }
  };
  return (
    <Button
      ref={ref}
      type="button"
      className={classNames(className, color, {
        active,
        'action-primary': primary,
      })}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      {label} {icon && <FontAwesomeIcon icon={icon} size="sm" />} {children}
    </Button>
  );
}

export default forwardRef(ActionButton);
