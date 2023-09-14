import { ComponentProps } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';

import ContentCard from './ContentCard';

export const FullPageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.accent[2]};
  min-height: 100%;
`;

export const FullPageTopBar = styled.div`
  padding: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent[5]};
  background-color: ${({ theme }) => theme.colors.gray[0]};
`;

export const FullPageContentCard = (
  props: ComponentProps<typeof ContentCard>
) => (
  <div
    css={css`
      display: grid;
      grid-template-columns: 1fr;
      padding: 4rem;
      align-items: center;
      justify-items: center;
    `}
  >
    <ContentCard
      css={css`
        width: 80vw;
        max-width: 80rem;

        .card-body {
          display: grid;
          gap: 0.5rem;
          padding: 1rem;
        }

        h1 {
          text-align: center;
          font-size: 1.5rem;
          font-family: 'Neue Machina', sans-serif;
        }

        h2 {
          font-size: 1.25rem;
          text-align: center;
        }

        p {
          font-size: 1.125rem;
          line-height: 1.85;
          margin: 0;
        }
      `}
      {...props}
    />
  </div>
);
