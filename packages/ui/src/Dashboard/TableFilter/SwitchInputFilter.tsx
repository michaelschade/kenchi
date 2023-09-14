import { forwardRef, useImperativeHandle, useRef } from 'react';

import { css } from '@emotion/react';

import { Switch } from '../../Form';
import { FilterComponent } from './types';

const SwitchInputFilter: FilterComponent<boolean, { label: string }> =
  forwardRef(({ label, value, onChange }, ref) => {
    const switchRef = useRef<HTMLButtonElement>(null);
    const id = useRef(`switch-input-filter-${Math.random()}`).current;
    useImperativeHandle(
      ref,
      () => ({ focus: () => switchRef.current?.focus() }),
      []
    );

    return (
      <div
        css={css`
          padding-left: 0.5rem;
          display: grid;
          grid-template-columns: auto min-content;
        `}
      >
        <label htmlFor={id}>{label}</label>
        <Switch
          ref={switchRef}
          id={id}
          onCheckedChange={onChange}
          checked={value ?? false}
        />
      </div>
    );
  });

SwitchInputFilter.isInlineFilter = true;
SwitchInputFilter.shouldFilterWhenOff = true;
SwitchInputFilter.convertFromQueryParam = (value) => value === 'true';
SwitchInputFilter.convertToQueryParam = (value) => (value ? 'true' : undefined);

export { SwitchInputFilter };
