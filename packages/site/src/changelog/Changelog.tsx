import React from 'react';

import { css } from '@emotion/react';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import { DateTime } from 'luxon';

import Breakpoints from '../breakpoints';
import { BaseSection } from '../components/BaseSection';
import { HeadingAndSub } from '../components/HeadingAndSub';
import { MonthOfChanges } from './MonthOfChanges';
import { productChanges } from './productChanges';

const changesByMonthAndYear = groupBy(
  productChanges,
  (change) => `${change.date.month}-${change.date.year}`
);

const sortedMonthAndYearKeys = orderBy(
  Object.keys(changesByMonthAndYear),
  (key: string) => {
    const [month, year] = key.split('-');
    const date = DateTime.local(parseInt(year, 10), parseInt(month, 10));
    return date.toJSDate().getTime();
  },
  'desc'
);

export const ChangelogSection = () => {
  return (
    <BaseSection
      css={css`
        padding: 5rem 0;
        column-gap: 0;
        row-gap: 2.5rem;
        ${Breakpoints.small} {
          padding: 2.5rem 0;
        }
      `}
    >
      <HeadingAndSub
        heading="Changelog"
        subheading="The latest in Kenchi-land"
      />
      <div
        css={css`
          display: grid;
          grid-column: 4 / span 10;
          row-gap: 2rem;
          grid-template-columns: repeat(10, 1fr);

          ${Breakpoints.small} {
            grid-column: 2 / span 14;
            row-gap: 2rem;
          }
        `}
      >
        {sortedMonthAndYearKeys.map((monthAndYearKey) => (
          <MonthOfChanges
            productChanges={changesByMonthAndYear[monthAndYearKey]}
            key={monthAndYearKey}
          />
        ))}
      </div>
    </BaseSection>
  );
};
