import { forwardRef, useImperativeHandle, useRef } from 'react';

import styled from '@emotion/styled';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { FilterRef } from './types';

const Container = styled.div`
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 0.25rem;
`;

const RangeValueContainer = styled.div`
  white-space: nowrap;
  text-align: center;
`;

const Slider = styled(SliderPrimitive.Root)`
  position: relative;
  display: grid;
  align-items: center;
  user-select: none;
  touch-action: none;
  width: 10rem;
`;

const Track = styled(SliderPrimitive.Track)`
  background-color: #dcdcdc;
  position: relative;
  border-radius: 9999px;
  height: 3px;
`;

const Range = styled(SliderPrimitive.Range)`
  position: absolute;
  background-color: ${({ theme }) => theme.colors.accent[9]};
  border-radius: 9999px;
  height: 100%;
`;

const Thumb = styled(SliderPrimitive.Thumb)`
  all: unset;
  background-color: white;
  border-radius: 50%;
  border: 1px solid #b4b4b4;
  display: block;
  height: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  width: 1rem;
  &:focus {
    border-color: hsl(211deg 100% 75%);
    box-shadow: 0 0 0 0.2rem hsl(211deg 100% 50% / 25%);
    outline: 0;
  }
`;

export type NumberRange = [number, number];

type RangeFilterProps = {
  onChange: (value: NumberRange) => void;
  value?: NumberRange;
  min: number;
  max: number;
  step?: number;
  valueSuffix?: string;
};

export const RangeFilter = forwardRef(
  (
    { value, onChange, min, max, step = 1, valueSuffix = '' }: RangeFilterProps,
    ref: React.Ref<FilterRef>
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(
      ref,
      () => ({ focus: () => inputRef.current?.focus() }),
      []
    );

    let rangeValueText;
    if (value) {
      rangeValueText =
        value[0] === value[1]
          ? `${value[0]}${valueSuffix}`
          : `${value[0]}-${value[1]}${valueSuffix}`;
    } else {
      rangeValueText = `${min}-${max}${valueSuffix}`;
    }

    return (
      <Container>
        <Slider
          aria-label="Range"
          onValueChange={onChange}
          min={min}
          max={max}
          step={step}
          value={value || [min, max]}
        >
          <Track>
            <Range />
          </Track>
          <Thumb ref={inputRef} />
          <Thumb />
        </Slider>
        <RangeValueContainer>{rangeValueText}</RangeValueContainer>
      </Container>
    );
  }
);
