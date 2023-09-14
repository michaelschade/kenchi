import { forwardRef } from 'react';

import { css } from '@emotion/react';
import { NavLink } from 'react-router-dom';

import { KenchiTheme } from './Colors';

// React Router's Link component doesn't account for external links. To make it
// easier to create links to ~anything, we'll normalize between external vs.
// client-side links ourselves. This gives us added benefits of being able to
// ensure tighter security for external links.

// TODO: add rel="noopener noreferer" when target="_blank"

// TODO: make `onClick` only trigger when no modifier keys are active

export const isExternal = (to: string) =>
  /^([a-z][a-z0-9.+-]*:)?\/\//i.test(to) || to.startsWith('mailto:');

type ActiveConfig = {
  exact?: boolean;
  className?: string;
};

// The irony of having linkStyle for a thing called UnstyledLink is not lost on
// me.
const linkStyle = ({ colors }: KenchiTheme) => css`
  color: ${colors.accent[9]};
  &:hover {
    color: ${colors.accent[11]};
  }
`;

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to?: string;
  active?: ActiveConfig;
};

export const UnstyledLink = forwardRef<HTMLAnchorElement, Props>(
  ({ to, active, ...props }, ref) => {
    if ((to && isExternal(to)) || !to) {
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      return <a ref={ref} href={to} css={linkStyle} {...props} />;
    } else {
      const className = props.className;
      return (
        <NavLink
          css={linkStyle}
          ref={ref}
          to={to}
          exact={active?.exact}
          {...props}
          className={
            active?.className
              ? (isActive) =>
                  isActive
                    ? `${active.className} ${className || ''}`
                    : className || ''
              : className
          }
        />
      );
    }
  }
);
