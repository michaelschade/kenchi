import React from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { BaseSection } from '../components/BaseSection';
import checkCircle from '../components/check_circle.svg';
import { HeadingAndSub } from '../components/HeadingAndSub';

type FeatureSet = {
  unlimitedSnipets: boolean;
  unlimitedPlaybooks: boolean;
  unlimitedCollections: boolean;
  sybg: boolean;
  googleAuth: boolean;
  simpleAccessControl: boolean;
  advancedAccessControl: boolean;
  suggestions: boolean;
  simpleInsights: boolean;
  advancedInsights: boolean;
  urgentSupport: boolean;
};

export type Plan = {
  name: string;
  pricePerUserMonthly: number;
  featureSet: FeatureSet;
};

type PricingTableSectionProps = {
  plans: Record<string, Plan>;
};

export const features = {
  unlimitedSnipets: { name: 'Unlimited text snippets' },
  unlimitedPlaybooks: { name: 'Unlimited playbooks' },
  unlimitedCollections: { name: 'Unlimited Collections' },
  sybg: { name: "Since you've been gone" },
  googleAuth: { name: 'Google SSO' },
  simpleAccessControl: { name: 'Content editing access controls' },
  suggestions: { name: 'Suggested Edits' },
  simpleInsights: { name: 'Kenchi Insights' },
  advancedAccessControl: { name: 'Advanced access controls' },
  advancedInsights: { name: 'Advanced Insights' },
  urgentSupport: { name: 'Urgent support' },
};

const pricingTableStyle = css`
  grid-column: 3 / span 12;
  font-family: 'Neue Machina', sans-serif;

  .feature-name {
    font-size: 1.125rem;
  }

  tr:nth-of-type(odd) {
    background-color: #f6f6ff;
  }

  thead > tr {
    border-bottom: 1px solid ${BrandColors.black};
  }

  th {
    text-align: center;
    text-transform: uppercase;
    font-size: 1.5rem;
    font-weight: 100;
    padding: 0.5rem;
    &:nth-of-type(2) {
      background-color: ${BrandColors.periwinkleLight};
    }
    &:nth-of-type(3) {
      background-color: ${BrandColors.periwinkle};
    }
    &:nth-of-type(4) {
      background-color: ${BrandColors.black};
      color: ${BrandColors.white};
    }
  }

  tr,
  thead {
    height: 4rem;
  }

  td,
  th {
    padding: 1rem;
    &:not(:first-of-type) {
      border-left: 1px solid ${BrandColors.grey};
      text-align: center;
      width: 13rem;
    }
    &:not(:last-of-type) {
      border-right: 1px solid ${BrandColors.grey};
    }
  }

  th:nth-of-type(2) {
    border-left: none;
  }

  th:first-of-type {
    border-right: none;
  }
`;

const Checkbox = () => <img src={checkCircle} alt="checked" />;

const PricingTable = ({ plans }: PricingTableSectionProps) => {
  const { basic, team, enterprise } = plans;
  return (
    <table css={pricingTableStyle}>
      <thead>
        <tr>
          <th
            css={css`
              visibility: hidden;
            `}
          >
            Plan
          </th>
          {[basic, team, enterprise].map((plan) => (
            <th key={plan.name}>{plan.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(features).map(([featureKey, feature]) => (
          <tr key={featureKey}>
            <td className="feature-name">{feature.name}</td>
            {[basic, team, enterprise].map((plan) => {
              if (featureKey === 'unlimitedCollections') {
                return (
                  <td key={plan.name}>
                    {plan.featureSet.unlimitedCollections ? (
                      <Checkbox />
                    ) : (
                      'Limit 3'
                    )}
                  </td>
                );
              }
              return (
                <td key={plan.name}>
                  {plan.featureSet[featureKey as keyof typeof features] ? (
                    <Checkbox />
                  ) : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const PricingTableSection = ({ plans }: PricingTableSectionProps) => {
  return (
    <BaseSection
      css={css`
        padding-top: 5rem;
        row-gap: 4rem;
        ${Breakpoints.small} {
          // We show the plan details in each PlanCard on mobile
          display: none;
        }
      `}
    >
      <HeadingAndSub heading="What's included" />
      <PricingTable plans={plans} />
    </BaseSection>
  );
};
