import { useEffect, useState } from 'react';

import { useTheme } from '@emotion/react';
import uniqBy from 'lodash/uniqBy';
import CreatableSelect from 'react-select/creatable';

import { BaseFormGroupProps, FormGroup } from './FormGroup';

const createOption = (label: string) => ({
  label,
  value: label,
});

type MultiInputValue = {
  label: string;
  value: string;
};

type MultiInputProps = {
  id?: string;
  values?: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  menuEnabled?: boolean;
  options?: MultiInputValue[];
  formatCreateLabel?: (inputValue: string) => string;
  noOptionsMessage?: () => string;
  disabled?: boolean;
};
type MultiInputGroupProps = MultiInputProps & BaseFormGroupProps;

export const MultiInputGroup = ({
  id,
  label,
  labelHidden,
  description,
  ...props
}: MultiInputGroupProps) => {
  return (
    <FormGroup
      id={id}
      label={label}
      labelHidden={labelHidden}
      description={description}
      design={props.design}
    >
      {(id) => <MultiInput id={id} {...props} />}
    </FormGroup>
  );
};

export const MultiInput = ({
  id,
  values = [],
  placeholder = '',
  onChange,
  menuEnabled = false,
  options = [],
  formatCreateLabel,
  noOptionsMessage,
  disabled = false,
  ...props
}: MultiInputProps) => {
  const [inputValue, setInputValue] = useState(''); // What the user is typing before it's entered
  const [selectValues, setSelectValues] = useState<MultiInputValue[]>([]);

  useEffect(() => {
    setSelectValues(values.map(createOption));
  }, [values]);

  const { colors } = useTheme();

  return (
    <CreatableSelect
      isDisabled={disabled}
      inputId={id}
      components={{ DropdownIndicator: null }}
      isClearable
      isMulti
      menuIsOpen={menuEnabled ? undefined : false}
      value={selectValues}
      inputValue={inputValue}
      formatCreateLabel={formatCreateLabel}
      noOptionsMessage={noOptionsMessage}
      onInputChange={(value) => setInputValue(value)}
      onChange={(vals) => {
        if (vals && 'length' in vals) {
          setSelectValues(vals as any);
          onChange(vals.map((v) => v.value));
        } else {
          setSelectValues([]);
          onChange([]);
        }
      }}
      onBlur={() => {
        if (!inputValue) {
          return;
        }
        setSelectValues((sv) => {
          const vals = uniqBy(
            [...sv, createOption(inputValue)],
            (v) => v.value
          );
          onChange(vals.map((v) => v.value));
          return vals;
        });
        setInputValue('');
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (!inputValue) {
          return;
        }
        switch (event.key) {
          case ',':
          case 'Enter':
          case 'Tab':
            setSelectValues((sv) => {
              const vals = uniqBy(
                [...sv, createOption(inputValue)],
                (v) => v.value
              );
              onChange(vals.map((v) => v.value));
              return vals;
            });
            setInputValue('');
            event.preventDefault();
            break;
        }
      }}
      options={options}
      placeholder={placeholder}
      // This menuPortalTarget prop and pointerEvents: 'auto' constitute a bit
      // of a hack. We must portal the ReactSelect with menuPortalTarget in
      // order for the open menu to be able to extend beyond the bounds of the
      // Dailog. And we must set pointerEvents: 'auto' to allow interaction
      // with the open menu, since our Dialog uses Radix Dialog, which
      // prevents interaction outside of itself (as is the correct behavior of
      // a modal dialog). Since the menu content is portalled, it's outside of
      // the Dialog's DOM tree.
      // TODO(dave): remove that hack if/when we switch to Radix Select.
      menuPortalTarget={document.body}
      styles={{
        menuPortal: (base) => ({
          ...base,
          pointerEvents: 'auto',
        }),
        control: (provided, { isDisabled }) => ({
          ...provided,
          backgroundColor: isDisabled ? colors.gray[3] : colors.gray[0],
          borderColor: colors.gray[6],
          '&:hover': {
            borderColor: colors.gray[8],
          },
        }),
        multiValue: (provided) => ({
          ...provided,
          backgroundColor: colors.gray[5],
          borderColor: colors.gray[7],
          color: colors.gray[11],
        }),
        multiValueLabel: (provided) => ({
          ...provided,
          color: colors.gray[12],
        }),
        multiValueRemove: (provided, state) => ({
          ...provided,
          color: colors.gray[12],
          '&:hover': {
            backgroundColor: colors.red[6],
            color: colors.red[9],
          },
        }),
        clearIndicator: (provided) => ({
          ...provided,
          cursor: 'pointer',
          color: colors.gray[12],
          '&:hover': {
            color: colors.red[9],
          },
        }),
        input: (provided) => ({
          ...provided,
          color: colors.gray[12],
        }),
      }}
      {...props}
    />
  );
};
