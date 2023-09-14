import { css } from '@emotion/react';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Eyebrow } from '@kenchi/ui/lib/Headers';

const containerStyle = ({ colors }: KenchiTheme) => css`
  /* offset container padding */
  margin-left: -15px;
  margin-right: -15px;
  background-color: ${colors.gray[0]};
  border-color: ${colors.gray[3]};
  color: ${colors.gray[12]};

  ${tw`text-sm relative border-0 border-t-2 border-b-2 border-solid`}
`;

const headerStyle = css`
  ${tw`text-center pt-1`}
`;

const contentStyle = css`
  ${tw`p-4 pt-3`}

  word-break: break-word;

  p,
  ol,
  ul,
  li {
    ${tw`m-0`}
  }
  p:empty {
    ${tw`h-3`}
  }
  li + li {
    ${tw`mt-1`}
  }
`;

type Props = {
  children: React.ReactNode;
};

export const ToolContentsPreview = ({ children }: Props) => (
  <div css={containerStyle}>
    <Eyebrow css={headerStyle}>Preview</Eyebrow>
    <div css={contentStyle}>{children}</div>
  </div>
);
