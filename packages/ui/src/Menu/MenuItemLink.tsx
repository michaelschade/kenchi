import { css } from '@emotion/react';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { KenchiTheme } from '../Colors';
import { UnstyledLink } from '../UnstyledLink';

const listItemStyle = css`
  all: unset;
  display: block;
`;

const linkStyle = ({ colors }: KenchiTheme) => css`
  display: flex;
  align-items: center;
  line-height: 1.5;
  padding: 0.4rem 0;
  cursor: pointer;

  transition: color 0.25s ease-in, background-position 0.25s linear;
  color: ${colors.gray[12]};
  background-size: 200% 100%;
  background-image: linear-gradient(
    to left,
    ${colors.accent[4]} 50%,
    transparent 50%
  );

  &:hover {
    text-decoration: none;
    color: ${colors.accent[11]};
    background-position: -100%;
  }

  > .icon {
    flex-shrink: 0;
    width: 1.9rem;
    display: flex;
    justify-content: center;
  }
  > .no-icon {
    width: 0.75rem;
  }
  > .label {
    flex-grow: 1;
    padding-right: 0.75rem;
  }

  &.active {
    background: ${colors.accent[4]};
    color: ${colors.accent[11]};
  }
`;

const truncateStyle = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type Props = Omit<React.ComponentProps<typeof UnstyledLink>, 'to'> & {
  to?: string;
  icon?: IconDefinition;
  hideIcon?: boolean;
  truncate?: boolean;
  children: React.ReactNode;
};

export const MenuItemLink = ({
  icon,
  hideIcon,
  truncate,
  children,
  ...linkProps
}: Props) => {
  const contents = (
    <>
      {!hideIcon ? (
        <span className="icon">
          {icon ? <FontAwesomeIcon fixedWidth icon={icon} size="sm" /> : null}
        </span>
      ) : (
        // This is really ugly but we have a lot of menu-related components
        // that expect certain spacing for icons and it's hard to change that
        // only here. It'd also be nice to pass `hideIcon` (or similar) prop
        // to the `<Menu>` and have it trickle down to all items. This will
        // need a bigger refactor.
        // TODO(kevin): refactor menu components
        <span className="no-icon" />
      )}
      <span className="label" css={truncateStyle}>
        {children}
      </span>
    </>
  );

  return (
    <li css={listItemStyle}>
      {linkProps.to ? (
        <UnstyledLink css={linkStyle} to={linkProps.to} {...linkProps}>
          {contents}
        </UnstyledLink>
      ) : (
        <span css={linkStyle} {...linkProps}>
          {contents}
        </span>
      )}
    </li>
  );
};
