import { css } from '@emotion/react';
import tw from 'twin.macro';

const spanStyle = css`
  text-decoration: line-through 10% wavy;
  opacity: 0.3;
`;

export const PlaceholderText = ({ children }: { children: string }) => (
  <>
    {children.split(/(\s+)/).map((str, i) =>
      /\s/.test(str) ? (
        str
      ) : (
        <span key={i} css={spanStyle}>
          <span css={tw`text-transparent`}>{str}</span>
        </span>
      )
    )}
  </>
);
