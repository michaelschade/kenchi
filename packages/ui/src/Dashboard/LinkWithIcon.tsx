import { forwardRef } from 'react';

import { css } from '@emotion/react';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { LinkButton } from '../Button';
import { UnstyledLink } from '../UnstyledLink';

type LinkWithIconProps = {
  children: React.ReactNode;
  to: string;
  icon: IconDefinition;
};

export const LinkWithIcon = ({
  children,
  to,
  icon,
  ...props
}: LinkWithIconProps) => (
  <UnstyledLink
    to={to}
    css={css`
      align-items: center;
      display: inline-grid;
      gap: 0.25rem;
      grid-auto-flow: column;
    `}
    {...props}
  >
    <FontAwesomeIcon size="sm" icon={icon} />
    {children}
  </UnstyledLink>
);

type LinkButtonWithIconProps = {
  children: React.ReactNode;
  onClick?: () => void;
  icon: IconDefinition;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export const LinkButtonWithIcon = forwardRef(
  (
    { children, onClick, icon, ...props }: LinkButtonWithIconProps,
    ref: React.Ref<HTMLButtonElement>
  ) => (
    <LinkButton
      ref={ref}
      onClick={onClick}
      css={css`
        align-items: center;
        display: inline-grid;
        gap: 0.25rem;
        grid-auto-flow: column;
        padding: 0;
        white-space: nowrap;
      `}
      {...props}
    >
      <FontAwesomeIcon size="sm" icon={icon} />
      {children}
    </LinkButton>
  )
);
