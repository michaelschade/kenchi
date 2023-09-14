import { css } from '@emotion/react';
import tw from 'twin.macro';

import { KenchiTheme } from '../Colors';

export const ContentColumnHeading = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div
    css={({ colors }: KenchiTheme) =>
      css`
        color: ${colors.gray[11]};
        ${tw`text-base font-semibold border-0 border-b-2 border-solid border-transparent`}
      `
    }
  >
    {children}
  </div>
);
