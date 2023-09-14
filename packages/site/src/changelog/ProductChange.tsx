import React from 'react';

import { css } from '@emotion/react';

import type { ProductChangeType } from './productChanges';

type ProductChangeProps = {
  productChange: ProductChangeType;
};

export const ProductChange = ({ productChange }: ProductChangeProps) => {
  const { description } = productChange;

  return (
    <div
      css={css`
        border-left: 1px solid transparent;
        display: grid;
        font-size: 1rem;
        gap: 0.5rem;
        p {
          font-size: 1rem;
        }
      `}
    >
      <div
        css={css`
          display: grid;
          gap: 0.5rem;
        `}
      >
        {description}
      </div>
    </div>
  );
};
