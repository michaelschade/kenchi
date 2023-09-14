import { Fragment } from 'react';

import { css } from '@emotion/react';

import { KenchiTheme } from './Colors';

type PropsForTextWithHighlight = {
  text: string;
  partToHighlight: string;
};

export const TextWithHighlight = ({
  text,
  partToHighlight,
}: PropsForTextWithHighlight) => {
  const regex = new RegExp(`(${partToHighlight})`, 'gi');
  const parts = text.split(regex);

  if (!partToHighlight) {
    return <>{text}</>;
  }

  return (
    <span>
      {parts.filter(String).map((part, index) => {
        return regex.test(part) ? (
          <mark
            css={({ colors }: KenchiTheme) => css`
              background-color: transparent;
              color: ${colors.accent[9]};
              font-weight: 600;
              padding: 0.25rem 0;
              margin: -0.25rem 0;
              border-radius: 0.25rem;
            `}
            key={index}
          >
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        );
      })}
    </span>
  );
};
