import { css } from '@emotion/react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { KenchiTheme } from '../Colors';

export type BaseFormProps = {
  error?: string | boolean;
  icon?: IconDefinition;
  tooltip?: string;
  design?: 'normal' | 'condensed';
};

export const baseFormControl = ({ colors }: KenchiTheme) => css`
  display: block;
  width: 100%;
  height: calc(1.5em + 0.75rem + 2px);
  padding: 0.375em 0.5em;
  font-size: 1em;
  font-weight: 400;
  line-height: 1.6;
  color: ${colors.gray[12]};
  background-color: ${colors.gray[0]};
  background-clip: padding-box;
  border: 1px solid ${colors.gray[7]};
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &.design-condensed {
    height: fit-content;
    padding: 0 0.1em;
  }

  &:focus {
    color: ${colors.gray[12]};
    background-color: ${colors.gray[0]};
    border-color: ${colors.accent[8]};
    outline: 0;
    box-shadow: 0 0 0 0.2rem ${colors.accent[7]};
  }

  &:disabled,
  &[readonly] {
    background-color: ${colors.gray[3]};
    opacity: 1;
  }
`;
