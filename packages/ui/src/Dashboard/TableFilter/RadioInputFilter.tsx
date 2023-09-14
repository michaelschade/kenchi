import { forwardRef } from 'react';

import { RadioGroup } from '../../Form';
import { Stack } from '../../Stack';
import { FilterRef } from './types';

type RadioInputFilterProps = {
  ariaLabel?: string;
  onChange: (value: string) => void;
  value?: string;
  options: { value: string; label: string }[];
};

export const RadioInputFilter = forwardRef(
  (
    { ariaLabel, value, onChange, options }: RadioInputFilterProps,
    ref: React.Ref<FilterRef>
  ) => {
    return (
      <Stack gap={2}>
        <RadioGroup
          // aria-label={ariaLabel}
          onChange={onChange}
          value={value}
          options={options}
          ref={ref}
        />
      </Stack>
    );
  }
);
