import { css } from '@emotion/react';
import tw from 'twin.macro';

export const pageBackgroundGradient = css`
  background-image: linear-gradient(
      217deg,
      rgba(255, 0, 0, 0.05),
      rgba(255, 0, 0, 0) 70.71%
    ),
    linear-gradient(
      127deg,
      hsla(120, 100%, 50%, 0.05),
      hsla(120, 100%, 50%, 0) 70.71%
    ),
    linear-gradient(
      336deg,
      hsla(240, 100%, 50%, 0.05),
      hsla(240, 100%, 50%, 0) 70.71%
    );
`;

export const headingBackgroundGradient = css`
  background-image: linear-gradient(
    80.24deg,
    hsl(10, 68%, 74%) 14.68%,
    hsl(356, 48%, 70%) 52.36%,
    hsl(315, 50%, 71%) 88.58%
  );
`;

export const subheadingBackgroundGradient = css`
  background-image: linear-gradient(
    80.24deg,
    hsl(10, 48%, 69%) 14.68%,
    hsl(356, 54%, 69%) 52.36%,
    hsl(314, 45%, 64%) 88.58%
  );
`;

export const inactiveHeadingBackgroundGradient = css`
  background: linear-gradient(
    80.24deg,
    hsl(316, 32%, 86%) 14.68%,
    hsl(315, 21%, 80%) 52.36%,
    hsl(315, 17%, 77%) 88.58%
  );
`;

export const headingTextColor = css`
  color: transparent;
  background-clip: text;
  ${headingBackgroundGradient}

  &::selection {
    ${tw`bg-pink-200 bg-opacity-25`}
  }
`;

export const subheadingTextColor = css`
  color: transparent;
  background-clip: text;
  ${subheadingBackgroundGradient}

  &::selection {
    ${tw`bg-pink-200 bg-opacity-25`}
  }

  a {
    ${tw`font-semibold`}
    color: inherit;
  }
`;

export const kbdStyle = css`
  kbd {
    ${tw`inline-block bg-red-800 bg-opacity-30 px-1 rounded shadow-soft font-bold font-mono`}
  }
`;
