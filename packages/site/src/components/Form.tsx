import { css } from '@emotion/react';
import styled from '@emotion/styled';

const baseFormStyle = css`
  -webkit-appearance: none;
  border-radius: 0;
  font: var(--codeFont);
  font-size: var(--smallFontSize);
  padding: 0.2rem 0.4rem;

  color: var(--textColor);
  box-shadow: var(--shadow);
  background-color: var(--inputBackgroundColor);
  border: 1px solid var(--borderColor);

  &:focus {
    outline: none;
  }

  letter-spacing: 0.1em;
`;

export const Input = styled.input`
  ${baseFormStyle}
  transition: var(--shadowTransition);
  transition-property: box-shadow;

  &::placeholder {
    color: var(--placeholderColor);
    font-weight: var(--codeFontWeightLight);
  }

  &:focus {
    box-shadow: var(--shadowFocus);
    border-color: var(--borderFocusColor);
    outline: none;
  }
`;

export const Button = styled.button`
  ${baseFormStyle}
  font-weight: var(--codeFontWeightBold);
  user-select: none;

  &:active {
    font-weight: var(--codeFontWeightHeavy);
    color: var(--buttonFocusTextColor);
    box-shadow: var(--buttonShadowFocus);
    background-color: var(--buttonFocusBackgroundColor);
  }
`;
