import React, { ReactNode } from 'react';

import { css } from '@emotion/react';

import Breakpoints from '../breakpoints';
import { BaseSection } from './BaseSection';

const style = css`
  grid-column: 1 / span 16;
  row-gap: 1rem;

  p {
    font-size: 1.5rem;
    font-weight: 500;
  }

  h1,
  h2,
  p {
    grid-column: 4 / span 10;
    width: 100%;
    text-align: center;
  }

  ${Breakpoints.small} {
    h1,
    h2,
    p {
      grid-column: 2 / span 14;
      br,
      br:after {
        content: ' ';
      }
    }
  }
`;

export const HeadingAndSub = ({
  heading,
  subheading,
  size = 'large',
  primary = false,
  noPaddingBottom = false,
}: {
  heading: ReactNode;
  subheading?: ReactNode;
  size?: 'small' | 'large';
  primary?: boolean;
  noPaddingBottom?: boolean;
}) => {
  const HeadingTag = primary ? 'h1' : 'h2';
  return (
    <BaseSection as="div" css={style}>
      <HeadingTag className={size}>{heading}</HeadingTag>
      {subheading && <p>{subheading}</p>}
    </BaseSection>
  );
};
