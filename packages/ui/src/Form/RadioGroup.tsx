import { forwardRef, useImperativeHandle, useRef } from 'react';

import styled from '@emotion/styled';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

const Label = styled.label`
  cursor: pointer;
  margin: 0;
  font-size: 0.875rem;
`;

const RadioGroupRoot = styled(RadioGroupPrimitive.Root)`
  display: grid;
  gap: 0.25rem;
  padding: 0 0.25rem;
`;

const RadioItem = styled(RadioGroupPrimitive.Item)`
  align-items: center;
  background: none;
  border-radius: 500px;
  border: 1px solid ${({ theme }) => theme.colors.gray[9]};
  display: grid;
  height: 1rem;
  justify-content: center;
  outline: none;
  padding: 0;
  width: 1rem;
  &:focus {
    border-color: ${({ theme }) => theme.colors.accent[9]};
    outline: 0;
    box-shadow: 0 0 0 0.2rem hsl(211deg 100% 50% / 25%);
  }
`;

const RadioIndicator = styled(RadioGroupPrimitive.Indicator)`
  align-items: center;
  color: ${({ theme }) => theme.colors.accent[9]};
  display: grid;
  font-size: 11px;
  height: 100%;
  justify-content: center;
  position: relative;
  width: 100%;
  &:after {
    background-color: ${({ theme }) => theme.colors.accent[9]};
    border-radius: 50%;
    content: '';
    display: block;
    height: 8px;
    width: 8px;
  }
`;

const RadioItemAndLabelContainer = styled.div`
  align-items: center;
  border-radius: 0.2rem;
  border: 1px solid transparent;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: auto minmax(auto, 1fr);
`;

type PropsForRadioGroup = {
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
};

export const RadioGroup = forwardRef(
  (
    { options, value, onChange }: PropsForRadioGroup,
    ref: React.Ref<{
      focus: () => void;
    }>
  ) => {
    const firstRadioInputRef = useRef<HTMLButtonElement>(null);
    const idPrefix = useRef(`radio-input-filter-${Math.random()}-`);
    useImperativeHandle(
      ref,
      () => ({ focus: () => firstRadioInputRef.current?.focus() }),
      []
    );
    return (
      <RadioGroupRoot
        value={value}
        onValueChange={onChange}
        orientation="vertical"
      >
        {options.map(({ value, label }, index) => {
          const id = `${idPrefix.current}${value}`;
          return (
            <RadioItemAndLabelContainer key={value}>
              <RadioItem
                id={id}
                ref={index === 0 ? firstRadioInputRef : null}
                value={value}
              >
                <RadioIndicator />
              </RadioItem>
              <Label htmlFor={id}>{label}</Label>
            </RadioItemAndLabelContainer>
          );
        })}
      </RadioGroupRoot>
    );
  }
);
