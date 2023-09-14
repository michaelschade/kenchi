import React from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { BaseSection } from '../components/BaseSection';
import { HeadingAndSub } from '../components/HeadingAndSub';
import { PlanCard } from './PlanCard';
import { plans } from './plans';

const plansStyle = css`
  grid-column: 3 / span 12;
  align-items: end;
  justify-content: center;
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  ${Breakpoints.small} {
    grid-column: 2 / span 14;
    grid-template-columns: 1fr;
    row-gap: 1.5rem;
  }
`;

export const PlansSection = () => (
  <BaseSection
    css={css`
      padding-top: 5rem;
      row-gap: 5rem;
      ${Breakpoints.small} {
        padding-top: 2.5rem;
        row-gap: 2.5rem;
      }
    `}
  >
    <HeadingAndSub
      primary
      size="small"
      heading={
        <>
          Fair, predictable pricing <br />
          for every stage of growth
        </>
      }
      subheading={
        <>
          Built from the ground up for fast-growing teams. <br />
          Enterprise-level power out-of-the-box, with the simple pricing we all
          deserve.
        </>
      }
    />
    <div css={plansStyle}>
      <PlanCard
        plan={plans.basic}
        backgroundColor={BrandColors.periwinkleLight}
      />
      <PlanCard
        plan={plans.team}
        planForComparison={plans.basic}
        backgroundColor={BrandColors.periwinkle}
        size="large"
      />
      <PlanCard
        plan={plans.enterprise}
        planForComparison={plans.team}
        backgroundColor={BrandColors.black}
        color={BrandColors.white}
      />
    </div>
  </BaseSection>
);
