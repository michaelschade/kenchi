import { css } from '@emotion/react';
import tw from 'twin.macro';

const stackStyle = css`
  ${tw`flex`}

  /* Collapse/hide empty children */
  > :empty:not(input, textarea) {
    ${tw`hidden`}
  }
`;

const GAPS = {
  1: tw`gap-1`,
  2: tw`gap-2`,
  3: tw`gap-3`,
  4: tw`gap-4`,
  6: tw`gap-6`,
  8: tw`gap-8`,
  16: tw`gap-16`,
};

type Props = {
  direction?: 'vertical' | 'horizontal';
  gap?: keyof typeof GAPS;
  children: React.ReactNode;
};

export const Stack = ({ children, direction = 'vertical', gap = 1 }: Props) => (
  <div
    css={[
      stackStyle,
      direction === 'vertical' ? tw`flex-col` : tw`flex-row flex-wrap`,
      GAPS[gap],
    ]}
  >
    {children}
  </div>
);
