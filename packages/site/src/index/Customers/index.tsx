import React from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../../breakpoints';
import { BaseSection } from '../../components/BaseSection';
import customerChipper from './images/chipper-black.webp';
import customerCocoon from './images/cocoon-black.webp';
import customerNotion from './images/notion-black.webp';
import customerOpenPhone from './images/openphone-black.webp';
import customerOutschool from './images/outschool-black.webp';
import customerProperly from './images/properly-black.webp';

const style = css`
  grid-column: 2 / span 14;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  row-gap: 2rem;
  place-items: center;
  padding: 2.5rem 0;
  background-color: ${BrandColors.chartreuse};
  ${Breakpoints.medium} {
    grid-template-columns: repeat(3, 1fr);
  }

  ${Breakpoints.small} {
    grid-template-columns: repeat(2, 1fr);
  }

  img {
    max-height: 40px;
    max-width: 130px;
    user-select: none;
  }
`;

export default function Customers() {
  return (
    <BaseSection css={style}>
      <img src={customerNotion} alt="Notion logo" />
      <img src={customerOutschool} alt="Outschool logo" />
      <img src={customerOpenPhone} alt="OpenPhone logo" />
      <img src={customerProperly} alt="Properly logo" />
      <img src={customerChipper} alt="Chipper logo" />
      <img src={customerCocoon} alt="Cocoon logo" />
    </BaseSection>
  );
}
