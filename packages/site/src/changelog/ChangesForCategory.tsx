import React from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import { Pill, pillPaddingLeft } from './Pill';
import { ProductChange } from './ProductChange';
import { ProductChangeCategory, ProductChangeType } from './productChanges';

const pillColorForCategory: Record<
  ProductChangeCategory,
  keyof typeof BrandColors
> = {
  Editor: 'periwinkleLight',
  Potpourri: 'grey',
  Extension: 'chartreuse',
  Dashboard: 'periwinkle',
};

type PropsForChangesForCategory = {
  category: ProductChangeCategory;
  changes: Array<ProductChangeType>;
};

export const ChangesForCategory = ({
  category,
  changes,
}: PropsForChangesForCategory) => {
  return (
    <section
      css={css`
        display: grid;
        gap: 1rem;
      `}
      key={category}
    >
      <h3
        css={css`
          margin: 0 0 0 -${pillPaddingLeft};
        `}
      >
        <Pill color={pillColorForCategory[category as ProductChangeCategory]}>
          {category}
        </Pill>
      </h3>
      <ul
        css={css`
          display: grid;
          gap: 1rem;
        `}
      >
        {changes.map((change, index) => {
          return (
            <li key={index}>
              <ProductChange productChange={change} />
            </li>
          );
        })}
      </ul>
    </section>
  );
};
