import React from 'react';

import { css } from '@emotion/react';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { ChangesForCategory } from './ChangesForCategory';
import { pillPaddingLeft } from './Pill';
import { ProductChangeCategory, ProductChangeType } from './productChanges';

type PropsForMonthOfChanges = {
  productChanges: Array<ProductChangeType>;
};

const categoriesDisplayOrder: ProductChangeCategory[] = [
  'Dashboard',
  'Extension',
  'Editor',
  'Potpourri',
];

export const MonthOfChanges = ({ productChanges }: PropsForMonthOfChanges) => {
  const month = productChanges[0].date.month;
  const monthName = productChanges[0].date.monthLong;
  const year = productChanges[0].date.year;

  const groupedChanges = groupBy(productChanges, (change) => change.category);
  const groupedAndSortedChanges = Object.fromEntries(
    Object.entries(groupedChanges).map(([category, changes]) => [
      category,
      orderBy(changes, (change) => change.date.day, 'desc'),
    ])
  );

  return (
    <section
      css={css`
        grid-column: 1 / span 10;
        display: grid;
        gap: 1rem;

        .cta {
          color: ${BrandColors.black};
          // We put the padding top here on the <a>, rather than on the <h2>, to
          // keep some space above the link when scrolling to it via the hash.
          padding-top: 1rem;
          ${Breakpoints.small} {
            padding-top: 0.5rem;
          }
        }

        .cta:not(.button):after {
          border-bottom-color: ${BrandColors.black};
        }

        ul {
          list-style-type: circle;
          list-style-position: outside;
          padding-left: 1rem;
          margin: 0;
        }

        li::marker {
          color: ${BrandColors.grey};
        }

        ${Breakpoints.small} {
          grid-column: 1 / span 14;
          gap: 1rem;
        }
      `}
    >
      <div>
        <a
          href={`#${year}-${month}`}
          id={`${year}-${month}`}
          css={css`
            padding: 1rem;
            border-left: 1px solid ${BrandColors.periwinkle};
            display: inline-block;
            margin-left: -1rem;
            color: ${BrandColors.black};

            ${Breakpoints.small} {
              padding: ${pillPaddingLeft};
              margin-left: -${pillPaddingLeft};
            }

            h2 {
              font-size: 1rem;
              display: inline-block;
            }

            h2:after {
              display: block;
              content: '';
              border-bottom: solid 1px ${BrandColors.black};
              transform: scaleX(0);
              transition: 150ms ease-in;
              transform-origin: 0% 50%;
            }

            &:hover,
            &:focus {
              color: ${BrandColors.black};
              text-decoration: none;
              outline: none;

              h2:after {
                display: block;
                content: '';
                border-bottom: solid 1px ${BrandColors.black};
                transition: 150ms ease-in;
                transform-origin: 0% 50%;
                transform: scaleX(1);
              }
            }
          `}
        >
          <h2>
            <time dateTime={`${year}-${month}`}>
              {monthName} {year}
            </time>
          </h2>
        </a>
      </div>
      <div
        css={css`
          display: grid;
          gap: 2rem;
        `}
      >
        {categoriesDisplayOrder.map((category) => {
          const changes = groupedAndSortedChanges[category];
          if (!changes) {
            return null;
          }
          return (
            <ChangesForCategory
              key={category}
              category={category}
              changes={changes}
            />
          );
        })}
      </div>
    </section>
  );
};
