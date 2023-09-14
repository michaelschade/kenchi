import styled from '@emotion/styled';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';

type PillProps = { color?: keyof typeof COLOR_STYLES };

const COLOR_STYLES = {
  periwinkle: {
    backgroundColor: BrandColors.periwinkle,
    color: BrandColors.black,
  },
  periwinkleLight: {
    backgroundColor: BrandColors.periwinkleLight,
    color: BrandColors.black,
  },
  chartreuse: {
    backgroundColor: BrandColors.chartreuse,
    color: BrandColors.white,
  },
  grey: {
    backgroundColor: BrandColors.grey,
    color: BrandColors.white,
  },
  black: {
    backgroundColor: BrandColors.black,
    color: BrandColors.white,
  },
  white: {
    backgroundColor: BrandColors.white,
    color: BrandColors.black,
  },
};

export const pillPaddingLeft = '0.5rem';

export const Pill = styled.span<PillProps>`
  align-items: center;
  border-radius: 10rem;
  display: inline-flex;
  font-size: clamp(0.75rem, 1vw, 0.9rem);
  justify-content: center;
  padding: 0.25rem ${pillPaddingLeft};
  font-weight: 600;
  ${({ color = 'periwinkleLight' }) => COLOR_STYLES[color]};
  ${Breakpoints.small} {
    font-weight: 500;
  }
`;
