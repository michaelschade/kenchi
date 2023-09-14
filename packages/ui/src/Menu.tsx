import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';

import { KenchiTheme } from './Colors';

export { MenuItemLink } from './Menu/MenuItemLink';

/*
 * This file exposes menu items to be used in a list for navigation, e.g. in the
 * sidebar of the dashboard.
 */

export const MenuContainer = styled.div`
  font-size: 0.9em;
  line-height: 2;
  display: grid;

  --section-spacing: 0.5rem;
  &.compact {
    --section-spacing: 0.3rem;
  }

  gap: var(--section-spacing);

  &.padding {
    padding-top: var(--section-spacing);
    padding-bottom: var(--section-spacing);
  }
`;

const sectionStyle = ({ colors }: KenchiTheme) => css`
  color: ${colors.gray[11]};
  overflow: hidden;

  h2 {
    color: ${colors.accent[12]};
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
  }
`;

type MenuSectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  icon?: IconDefinition;
  style?: React.CSSProperties;
};

export const MenuSection = ({
  title,
  icon,
  children,
  style,
}: MenuSectionProps) => {
  return (
    <section css={sectionStyle} style={style} className={classNames({ icon })}>
      <div css={iconRowStyle}>
        {icon && <FontAwesomeIcon fixedWidth className="icon" icon={icon} />}
        <h2 className="content">{title}</h2>
      </div>
      {children}
    </section>
  );
};

export const MenuItemList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`;

const iconRowStyle = css`
  --hanging-indent: 0rem;
  &.hanging-indent {
    --hanging-indent: 0.5rem;
  }

  width: 100%;
  max-width: 100%;
  display: inline-grid;
  grid-template:
    'icon content' minmax(0, 1fr) / calc(1.9rem + var(--hanging-indent))
    minmax(0, 1fr);

  & > * {
    line-height: 2;
  }

  & > .icon {
    grid-area: icon;
    place-self: center;
    font-size: 0.8em;
  }

  & > .content {
    grid-area: content;
    padding-right: 0.75rem;

    & > * {
      vertical-align: middle;
    }
  }
  padding-top: 0.15rem;
  padding-bottom: 0.15rem;
  .compact & {
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
  }
`;

const menuItemStyle = ({ colors }: KenchiTheme) => css`
  margin: 0;

  &.no-wrap .content {
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.clickable {
    cursor: pointer;
    user-select: none;
    background-size: 200% 100%;
    background-image: linear-gradient(
      to left,
      hsla(210, 10%, 60%, 0.1) 50%,
      transparent 50%
    );

    &,
    & > .content > a {
      transition: color 0.25s ease-in, background-position 0.25s linear;
      color: ${colors.accent[9]};
    }

    &:hover,
    & > .content > a:hover {
      text-decoration: none;
      background-position: -100%;

      &,
      & > .content > a {
        color: ${colors.accent[10]};
      }
    }
  }

  &.active {
    background: hsla(210, 10%, 60%, 0.1);

    &,
    & > .content > a {
      color: hsla(210, 25%, 35%, 1);
      pointer-events: none;
    }
  }
`;

type MenuItemProps = React.LiHTMLAttributes<HTMLLIElement> & {
  noWrap?: boolean;
  hangingIndent?: boolean;
  icon?: IconDefinition;
};

export function MenuItem({
  hangingIndent,
  className,
  icon,
  noWrap,
  children,
  ...props
}: MenuItemProps) {
  return (
    <li
      css={[menuItemStyle, iconRowStyle]}
      className={classNames(className, {
        clickable: props.onClick,
        'hanging-indent': hangingIndent,
        'no-wrap': noWrap,
      })}
      {...props}
    >
      {icon && <FontAwesomeIcon className="icon" icon={icon} />}
      <div className="content">{children}</div>
    </li>
  );
}
