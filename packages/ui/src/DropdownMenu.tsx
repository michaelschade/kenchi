import { useEffect, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  faCheckCircle,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames/bind';

import { KenchiTheme } from './Colors';
import { UnstyledLink } from './UnstyledLink';
import { useHotkeyRegion } from './useHotkey';

type MenuOpenerProps = DropdownMenuPrimitive.DropdownMenuProps & {
  menuContent: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export const MenuOpener = ({
  children,
  menuContent,
  compact,
  className,
  onOpenChange,
  ...props
}: MenuOpenerProps) => {
  const enterRegion = useHotkeyRegion();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = props.open ?? uncontrolledOpen;
  useEffect(() => {
    if (open) {
      return enterRegion();
    }
  }, [enterRegion, open]);

  return (
    <DropdownMenuPrimitive.Root
      modal={false}
      onOpenChange={(open) => {
        setUncontrolledOpen(open);
        onOpenChange?.(open);
      }}
      {...props}
    >
      <MenuTrigger asChild>{children}</MenuTrigger>
      <MenuContent
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        align="end"
        sideOffset={2}
        alignOffset={2}
        className={classNames(className, compact)}
      >
        <MenuTriggerArrow width="16px" height="8px" offset={5} />
        {menuContent}
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  );
};

const MenuTrigger = DropdownMenuPrimitive.Trigger;
const MenuContent = styled(DropdownMenuPrimitive.Content)`
  border: 1px solid ${({ theme }) => theme.colors.gray[5]};
  border-radius: 0.2rem;
  box-shadow: 0px 0px 15px -2px ${({ theme }) => theme.colors.subtleShadow};
  background: ${({ theme }) => theme.colors.gray[2]};

  font-size: 0.85em;
  line-height: 2;
  display: grid;

  padding: 0.5em 0;
`;

const MenuTriggerArrow = styled(DropdownMenuPrimitive.Arrow)`
  fill: ${({ theme }) => theme.colors.accent[1]};
  transform: translateY(-2px);

  // Need to clip the stroke on the bottom
  clip-path: polygon(0 1px, 100% 1px, 100% 100%, 0 100%);
  stroke: ${({ theme }) => theme.colors.gray[5]};
  stroke-width: 1px;
`;

const baseMenuItemStyle = ({ colors }: KenchiTheme) => css`
  background-image: linear-gradient(
    to left,
    ${colors.accent[4]} 50%,
    transparent 50%
  );
  background-size: 200% 100%;

  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  outline: none;

  padding: 0.3em 0.75em 0.3em 0;
  .compact & {
    padding: 0.15em 0.75em 0.15em 0;
  }

  transition: color 0.25s ease-in, background-position 0.25s linear;
  user-select: none;
  align-items: baseline;

  &.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const clickableMenuItemStyle = ({ colors }: KenchiTheme) => css`
  cursor: pointer;
  color: ${colors.gray[12]};

  &:hover,
  &:focus {
    text-decoration: none;
    background-position: -100%;
    color: ${colors.accent[11]};
  }

  &:active,
  &.active {
    color: ${colors.accent[11]};
  }
`;

const IconContainer = styled.div`
  text-align: center;
  width: 1.9rem;

  svg {
    font-size: 0.8em;
  }
`;

type ExtraMenuItemProps = {
  truncate?: boolean;
  active?: boolean;
};

type MenuItemProps = DropdownMenuItemProps &
  ExtraMenuItemProps & {
    icon?: IconDefinition;
  };

export const MenuItem = ({
  children,
  icon,
  truncate,
  active,
  className,
  ...props
}: MenuItemProps) => (
  <DropdownMenuPrimitive.Item
    {...props}
    css={[baseMenuItemStyle, clickableMenuItemStyle]}
    className={classNames(className, { truncate, active })}
  >
    <IconContainer>{icon && <FontAwesomeIcon icon={icon} />}</IconContainer>
    {children}
  </DropdownMenuPrimitive.Item>
);

type MenuItemLinkProps = Omit<MenuItemProps, 'onClick'> &
  Pick<React.ComponentProps<typeof UnstyledLink>, 'to' | 'target' | 'onClick'>;
export const MenuItemLink = ({
  to,
  target,
  onClick,
  ...menuItemProps
}: MenuItemLinkProps) => {
  return (
    <UnstyledLink
      to={to}
      target={target}
      onClick={onClick}
      css={css`
        &:hover {
          text-decoration: none;
        }
      `}
    >
      <MenuItem {...menuItemProps} />
    </UnstyledLink>
  );
};

export const MenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const MenuItemRadio = ({
  children,
  className,
  truncate,
  active,
  ...props
}: DropdownMenuPrimitive.MenuRadioItemProps & ExtraMenuItemProps) => {
  return (
    <DropdownMenuPrimitive.RadioItem
      {...props}
      css={[baseMenuItemStyle, clickableMenuItemStyle]}
      className={classNames(className, { truncate, active })}
    >
      <IconContainer>
        <DropdownMenuPrimitive.ItemIndicator>
          <FontAwesomeIcon icon={faCheckCircle} />
        </DropdownMenuPrimitive.ItemIndicator>
      </IconContainer>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
};

// TODO:
// export const MenuItemCheckbox = DropdownMenuPrimitive.CheckboxItem;

const SectionWrapper = styled.section`
  color: ${({ theme }) => theme.colors.gray[12]};
  overflow: hidden;

  h2 {
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0;
  }
`;

type MenuSectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  icon?: IconDefinition;
};

export const MenuSection = ({ title, icon, children }: MenuSectionProps) => {
  return (
    <SectionWrapper>
      <DropdownMenuPrimitive.Label css={baseMenuItemStyle}>
        <IconContainer>{icon && <FontAwesomeIcon icon={icon} />}</IconContainer>
        <h2>{title}</h2>
      </DropdownMenuPrimitive.Label>
      {children}
    </SectionWrapper>
  );
};
