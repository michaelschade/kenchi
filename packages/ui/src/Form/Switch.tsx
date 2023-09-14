import { forwardRef } from 'react';

import styled from '@emotion/styled';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import classNames from 'classnames/bind';

import Tooltip from '../Tooltip';
import { BaseFormGroupProps } from './FormGroup';
import useFormGroupId from './useFormGroupId';

const StyledSwitch = styled(SwitchPrimitive.Root)`
  all: unset;
  margin-top: 0.25rem;
  width: calc(1.75rem - 2px);
  height: calc(1rem - 2px);
  background-color: hsl(0deg 0% 100%);
  border-radius: 9999px;
  position: relative;
  &:focus {
    box-shadow: 0 0 0 0.2rem hsl(211deg 100% 50% / 25%);
  }

  border-radius: 0.5rem;
  content: '';
  background-color: hsl(0deg 0% 100%);
  border: hsl(210deg 11% 71%) solid 1px;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;

  &[data-state='checked'] {
    color: hsl(0deg 0% 100%);
    border-color: ${({ theme: { colors } }) => colors.accent[9]};
    background-color: ${({ theme: { colors } }) => colors.accent[9]};
  }

  &:focus {
    box-shadow: 0 0 0 0.2rem hsl(211deg 100% 50% / 25%);
  }

  &:not(:disabled):active {
    color: hsl(0deg 0% 100%);
    background-color: hsl(212deg 100% 85%);
    border-color: hsl(212deg 100% 85%);
    box-shadow: none;
  }

  &:disabled {
    background-color: hsl(210deg 16% 93%);
  }

  &:disabled:checked {
    background-color: hsl(211deg 100% 50% / 50%);
  }
`;

const StyledThumb = styled(SwitchPrimitive.Thumb)`
  display: block;
  width: calc(1rem - 4px);
  height: calc(1rem - 4px);
  background: no-repeat 50% / 50% 50%;
  background-color: hsl(210deg 11% 71%);

  border-radius: 0.5rem;
  transform: translateX(1px);
  transition: transform 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  &[data-state='checked'] {
    background-color: hsl(0deg 0% 100%);
    transform: translateX(calc(0.75rem + 1px));
  }
`;

const SwitchWrapper = styled.div`
  min-height: 1.5rem;
  line-height: 1.6;
  display: grid;
  gap: 0.5rem;

  grid-template-columns: min-content auto;
  &.leftLabel {
    grid-template-columns: auto min-content;
  }

  label {
    margin-bottom: 0;
    display: inline;

    svg {
      font-size: 0.8em;
      margin-left: 7px;
      color: hsl(210deg 24% 77%);
      transition: color 0.2s ease-in-out;

      &:hover {
        color: hsl(212deg 24% 67%);
      }
    }
  }
`;

type SwitchProps = BaseFormGroupProps & {
  onCheckedChange?: (value: boolean) => void;
  checked?: boolean;
  disabled?: boolean;
  leftLabel?: boolean;
};

export const Switch = forwardRef(
  (
    {
      id,
      label,
      description,
      icon,
      error,
      design = 'normal',
      leftLabel,
      ...props
    }: SwitchProps,
    ref: React.Ref<HTMLButtonElement>
  ) => {
    const staticId = useFormGroupId(id);
    const labelSection = label && (
      <label htmlFor={staticId}>
        {label}

        {description && (
          <Tooltip mouseEnterDelay={0.2} placement="left" overlay={description}>
            <FontAwesomeIcon icon={icon || faInfoCircle} />
          </Tooltip>
        )}
      </label>
    );
    return (
      <SwitchWrapper className={classNames(`design-${design}`, { leftLabel })}>
        {leftLabel && labelSection}
        <StyledSwitch id={staticId} ref={ref} {...props}>
          <StyledThumb />
        </StyledSwitch>
        {!leftLabel && labelSection}
      </SwitchWrapper>
    );
  }
);
