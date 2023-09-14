import { forwardRef, useImperativeHandle, useRef } from 'react';

import styled from '@emotion/styled';

import MultiSelect, { MultiSelectOptionType } from '../../MultiSelect';
import { FilterRef } from './types';

const Container = styled.div`
  max-width: 220px;
`;

type MultiSelectFilterProps = {
  ariaLabel?: string;
  onChange: (value: string[]) => void;
  value?: string[];
  options: MultiSelectOptionType[];
};

export const MultiSelectFilter = forwardRef(
  (
    { ariaLabel, value, onChange, options }: MultiSelectFilterProps,
    ref: React.Ref<FilterRef>
  ) => {
    const firstRadioInputRef = useRef<HTMLButtonElement>(null);
    useImperativeHandle(
      ref,
      () => ({ focus: () => firstRadioInputRef.current?.focus() }),
      []
    );

    return (
      <Container>
        <MultiSelect
          aria-label={ariaLabel}
          autoFocus={true}
          onChange={onChange}
          options={options}
          selectedOptionIds={value || []}
          showTokens
        />
      </Container>
    );
  }
);
