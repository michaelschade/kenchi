import { css } from '@emotion/react';
import tw from 'twin.macro';

import { KenchiTheme } from '../Colors';
import { UnstyledLink } from '../UnstyledLink';

const pillStyle = tw`inline-flex text-xs px-1.5 rounded-lg font-medium`;

const linkPillStyle = ({ colors }: KenchiTheme) => css`
  ${pillStyle}
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: ${colors.gray[5]};
  color: ${colors.gray[11]};
  &:hover {
    background-color: ${colors.accent[4]};
    color: ${colors.accent[10]};
  }
`;

const COLORS = {
  gray: ({ colors }: KenchiTheme) => css`
    color: ${colors.gray[11]};
    background-color: ${colors.gray[5]};
  `,
  purple: tw`text-purple-600 bg-purple-200`,
  blue: ({ colors }: KenchiTheme) => css`
    color: ${colors.accent[10]};
    background-color: ${colors.accent[4]};
  `,
  red: tw`text-red-600 bg-red-100`,
  green: tw`text-green-700 bg-green-200`,
  yellow: tw`text-yellow-600 bg-yellow-100`,
};

const SIZE = {
  small: '',
  medium: tw`px-2 text-sm rounded-2xl`,
  large: tw`px-2.5 text-base rounded-2xl`,
};

type Props = {
  children: React.ReactNode;
  color?: keyof typeof COLORS;
  size?: keyof typeof SIZE;
};

export const Pill = ({ children, color = 'gray', size = 'small' }: Props) => (
  <span css={[pillStyle, COLORS[color], SIZE[size]]}>{children}</span>
);

type LinkPillProps = {
  children: React.ReactNode;
  size?: keyof typeof SIZE;
  to: string;
};

export const LinkPill = ({ children, size = 'small', to }: LinkPillProps) => (
  <UnstyledLink
    to={to}
    css={css`
      display: flex;
      &:hover {
        text-decoration: none;
      }
    `}
  >
    <span css={[pillStyle, linkPillStyle, SIZE[size]]}>{children}</span>
  </UnstyledLink>
);
