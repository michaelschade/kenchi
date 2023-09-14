import React from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { features, Plan } from './PricingTable';

const planCardStyle = css`
  &:first-of-type {
    border-top-left-radius: 0.5rem;
  }

  &:last-of-type {
    border-top-right-radius: 0.5rem;
  }

  ${Breakpoints.small} {
    border-radius: 0.5rem;
    &:hover {
      &:first-of-type {
        transform: scale(1);
      }
      &:nth-of-type(2) {
        transform: scale(1);
      }
      &:last-of-type {
        transform: scale(1);
      }
    }
  }

  transition: all 0.15s ease-out;
  &:first-of-type {
    transform-origin: bottom right;
  }
  &:nth-of-type(2) {
    z-index: 1;
    transform-origin: bottom;
  }
  &:last-of-type {
    transform-origin: bottom left;
  }

  .plan-name-container {
    padding: 2rem 0 1.5rem;
    text-transform: uppercase;
    text-align: center;
    border-bottom: 1px solid ${BrandColors.grey};

    h2 {
      font-size: 1.5rem;
    }
  }

  .price {
    font-size: clamp(2rem, 8vw, 5rem);
    font-weight: 300;
    font-family: 'Neue Machina', sans-serif;
  }

  .feature_list {
    display: none;
    grid-template-columns: 1fr;
    padding: 3rem 1rem;
    font-size: 1.25rem;
    text-align: center;
    gap: 1rem;
    h3 {
      font-size: 1.25rem;
    }

    ul {
      padding: 0;
      list-style-type: none;
      display: grid;
      gap: 0.5rem;
    }

    ${Breakpoints.small} {
      display: grid;
      padding: 2rem 1rem;
    }
  }
`;

type PlanCardProps = {
  plan: Plan;
  planForComparison?: Plan;
  size?: 'normal' | 'large';
  backgroundColor?: string;
  color?: string;
};

export const PlanCard = ({
  plan,
  planForComparison,
  size = 'normal',
  backgroundColor = BrandColors.periwinkle,
  color = BrandColors.black,
}: PlanCardProps) => {
  const { name, pricePerUserMonthly, featureSet } = plan;
  return (
    <a
      href="#join-waitlist"
      css={[
        planCardStyle,
        css`
          border-radius: ${size === 'large' ? '0.5rem 0.5rem 0 0' : ''};
          background-color: ${backgroundColor};
          color: ${color};
          &:hover,
          &:focus {
            transform: scale(1.02);
            text-decoration: none;
            color: ${color};
          }
        `,
      ]}
    >
      <div className="plan-name-container">
        <h2>{name}</h2>
      </div>
      <div
        css={css`
          padding: ${size === 'large' ? '5rem 0 7rem' : '5rem'} 0;
          text-align: center;

          ${Breakpoints.small} {
            padding: 1.5rem 0;
            border-bottom: 1px solid ${BrandColors.grey}
        `}
      >
        <p className="price">${pricePerUserMonthly}</p>
        <p>Per active user/mo</p>
      </div>
      <div className="feature_list">
        {planForComparison && (
          <h3>All {planForComparison.name} features, plus…</h3>
        )}
        <ul>
          {Object.entries(features).map(([featureKey, feature]) => {
            const comparisonPlanHasFeature =
              planForComparison &&
              planForComparison.featureSet[featureKey as keyof typeof features];
            const thisPlanHasFeature =
              featureSet[featureKey as keyof typeof features];
            if (comparisonPlanHasFeature || !thisPlanHasFeature) {
              return null;
            }
            return <li key={featureKey}>{feature.name}</li>;
          })}
        </ul>
      </div>
    </a>
  );
};
