import { HTMLAttributes } from 'react';

import { css } from '@emotion/react';

import { KenchiTheme } from './Colors';

// So that react-router-dom <Link> etc. can have the same styling
export const linkStyle = (
  { colors }: KenchiTheme,
  { underline } = { underline: true }
) => css`
  cursor: pointer;
  color: ${colors.accent[9]};
  transition: color 0.1s ease-in-out;

  &:hover {
    color: ${colors.accent[10]};
    text-decoration: ${underline ? 'underline' : 'none'};
  }
`;

export const Link = ({
  underline = true,
  ...props
}: { underline?: boolean } & HTMLAttributes<HTMLSpanElement>) => {
  return <span css={(theme) => linkStyle(theme, { underline })} {...props} />;
};
