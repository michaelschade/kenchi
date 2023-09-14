import { css } from '@emotion/react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import { KenchiTheme } from './Colors';
import Emoji from './Emoji';

// This component attempts to provide consistent alignment across a bunch of
// named things with corresponding emoji icons. If a fallback icon is not
// provided, an icon-sized space will be left in its place so a stack or table
// of names will be aligned.

type Props = {
  name: React.ReactNode;
  emoji?: string | null | undefined;
  fallbackIcon?: IconDefinition;
};

export const NameWithEmoji = ({ name, emoji, fallbackIcon }: Props) => (
  <span css={tw`inline-flex gap-2 items-baseline`}>
    <span
      css={[
        css`
          // This is a little hacky nudge to get the vertical alignment of the
          // icon juuust right
          transform: translateY(1px);
        `,
        tw`inline-flex w-4 justify-center text-base`,
      ]}
    >
      {emoji ? <Emoji emoji={emoji} /> : null}
      {!emoji && fallbackIcon ? (
        <FontAwesomeIcon
          icon={fallbackIcon}
          size="sm"
          css={({ colors }: KenchiTheme) => css`
            color: ${colors.gray[7]};
          `}
          fixedWidth
        />
      ) : null}
    </span>
    <span
      css={css`
        text-overflow: ellipsis;
        overflow: hidden;
        flex-shrink: 1;
      `}
    >
      {name}
    </span>
  </span>
);
