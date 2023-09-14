import { forwardRef, useImperativeHandle, useRef } from 'react';

import { faSearch } from '@fortawesome/pro-solid-svg-icons';

import { Input } from '../../Form';
import { FilterRef } from './types';

type TextInputFilterProps = {
  onChange: (value: string) => void;
  value?: string;
  placeholder?: string;
  ariaLabel?: string;
};

export const textInputFilterByKey =
  <TKey extends string>(key: TKey) =>
  (item: { [key in TKey]?: string | null }, value?: string) => {
    if (!value) {
      return true;
    }
    const itemValue = item[key];
    if (!itemValue) {
      return false;
    }
    return itemValue.toLowerCase().includes(value.toLowerCase());
  };

export const TextInputFilter = forwardRef(
  (
    { ariaLabel, value, onChange, placeholder }: TextInputFilterProps,
    ref: React.Ref<FilterRef>
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(
      ref,
      () => ({ focus: () => inputRef.current?.focus() }),
      []
    );

    return (
      <Input
        ref={inputRef}
        type="search"
        icon={faSearch}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            // Don't close the popover on Escape if the input has some text.
            // The customer might just want to clear the input.
            event.stopPropagation();
          }
        }}
        placeholder={placeholder}
        value={value || ''}
      />
    );
  }
);
