import React from 'react';

import { css } from '@emotion/react';

import Breakpoints from '../breakpoints';
import { BaseSection } from '../components/BaseSection';
import { HeadingAndSub } from '../components/HeadingAndSub';
import customerChipper from '../index/Customers/images/chipper-black.webp';
import customerCocoon from '../index/Customers/images/cocoon-black.webp';
import customerNotion from '../index/Customers/images/notion-black.webp';
import customerOpenPhone from '../index/Customers/images/openphone-black.webp';
import customerOutschool from '../index/Customers/images/outschool-black.webp';
import customerProperly from '../index/Customers/images/properly-black.webp';

const style = css`
  padding: 5rem 0;
  row-gap: 4rem;
  ${Breakpoints.small} {
    padding: 4rem 0;
    row-gap: 2.5rem;
  }
`;

const logoGridStyle = css`
  grid-column: 2 / span 14;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  row-gap: 2rem;
  place-items: center;

  ${Breakpoints.medium} {
    grid-template-columns: repeat(3, 1fr);
  }

  ${Breakpoints.small} {
    grid-template-columns: repeat(2, 1fr);
  }

  img {
    max-height: 30px;
    max-width: 130px;
    user-select: none;
  }
`;

export default function Customers() {
  return (
    <BaseSection css={style}>
      <HeadingAndSub heading="Trusted by stellar support teams" />
      <div css={logoGridStyle}>
        <img src={customerNotion} alt="Notion logo" />
        <img src={customerOutschool} alt="Outschool logo" />
        <img src={customerOpenPhone} alt="OpenPhone logo" />
        <img src={customerProperly} alt="Properly logo" />
        <img src={customerChipper} alt="Chipper logo" />
        <img src={customerCocoon} alt="Cocoon logo" />
      </div>
    </BaseSection>
  );
}
