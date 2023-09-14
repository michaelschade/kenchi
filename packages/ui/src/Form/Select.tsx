import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  faCheck,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as SelectPrimitive from '@radix-ui/react-select';

import { BaseFormGroupProps, FormGroup } from '.';

type Option = {
  label: ReactNode;
  value: string;
  disabled?: boolean;
};

type OptionsGroup = {
  label: string;
  options: Option[];
};

export type SelectOptions = Array<Option | OptionsGroup>;

type Size = 'small' | 'normal';

const ITEM_SIZE = {
  small: css`
    padding: 0.25rem 0.75rem;
    font-size: 0.85rem;
  `,
  normal: css`
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
  `,
};

const TRIGGER_SIZE = {
  small: css`
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
  `,
  normal: css`
    padding: 0.5rem;
    font-size: 1rem;
  `,
};

const isOptionsGroupArray = (
  options: SelectOptions
): options is OptionsGroup[] => {
  return (
    options.length > 0 &&
    options.every((option) => option.hasOwnProperty('options'))
  );
};

const isOptionsArray = (options: SelectOptions): options is Option[] => {
  return (
    options.length > 0 &&
    options.every((option) => option.hasOwnProperty('value'))
  );
};

const Trigger = styled(SelectPrimitive.Trigger)<{ size: Size }>`
  background-color: ${({ theme }) => theme.colors.gray[0]};
  border-radius: 0.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[6]};
  color: ${({ theme }) => theme.colors.gray[12]};
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr auto;
  outline: none;
  text-align: left;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  ${({ size }) => TRIGGER_SIZE[size]};
  &:focus {
    border-color: ${({ theme: { colors } }) => colors.accent[9]};
    box-shadow: 0 0 0 0.2rem ${({ theme: { colors } }) => colors.accent[7]};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray[3]};
    color: ${({ theme }) => theme.colors.gray[9]};
  }
`;

const Content = styled(SelectPrimitive.Content)`
  background-color: ${({ theme }) => theme.colors.gray[0]};
  border-radius: 0.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[3]};
  box-shadow: 0px 0px 15px 0px ${({ theme }) => theme.colors.subtleShadow};

  // This max-width is a hack to make the dropdown not be wider than the
  // extension iframe
  max-width: 88vw;
`;

const Item = styled(SelectPrimitive.Item)<{ size: Size }>`
  color: ${({ theme }) => theme.colors.gray[12]};
  cursor: pointer;
  outline: none;
  display: grid;
  gap: 0.25rem;
  grid-template-columns: auto 1fr;
  ${({ size }) => ITEM_SIZE[size]};

  &:hover,
  &:focus {
    background-color: ${({ theme }) => theme.colors.accent[4]};
  }
  &[data-disabled] {
    color: ${({ theme }) => theme.colors.gray[9]};
  }
`;

const PlaceholderItem = styled(SelectPrimitive.Item)<{ size: Size }>`
  color: ${({ theme }) => theme.colors.gray[12]};
  outline: none;
  cursor: default;
  ${({ size }) => ITEM_SIZE[size]};
`;

const IndicatorSlot = styled.div`
  width: 1rem;
`;

const GroupLabel = styled(SelectPrimitive.Label)`
  cursor: default;
  padding: 0.5rem 0.75rem;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[9]};
`;

const ScrollUpButton = styled(SelectPrimitive.ScrollUpButton)`
  color: ${({ theme }) => theme.colors.gray[10]};
  text-align: center;
`;

const ScrollDownButton = styled(SelectPrimitive.ScrollDownButton)`
  color: ${({ theme }) => theme.colors.gray[10]};
  text-align: center;
`;

const Separator = styled(SelectPrimitive.Separator)`
  background-color: ${({ theme }) => theme.colors.gray[4]};
  height: 1px;
  width: calc(100% - 1rem);
  margin: 0.5rem;
`;

type PropsForSelect = {
  id?: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
  options: SelectOptions;
  placeholder?: string;
  shouldChangeValueOnSelect?: boolean;
  size?: 'small' | 'normal';
  value?: string;
};

export const Select = ({
  id,
  disabled = false,
  onSelect,
  options,
  placeholder,
  shouldChangeValueOnSelect = true,
  size = 'normal',
  value: valueProp,
}: PropsForSelect) => {
  const initialValue = useMemo(() => {
    if (valueProp) {
      return valueProp;
    }
    if (placeholder) {
      return '';
    }
    if (isOptionsGroupArray(options)) {
      return options[0].options[0].value;
    }
    if (isOptionsArray(options)) {
      return options[0].value;
    }
    return '';
  }, [options, placeholder, valueProp]);

  const [value, setValue] = useState<string | undefined>(initialValue);

  useEffect(() => {
    if (valueProp != null) {
      setValue(valueProp);
    }
  }, [valueProp]);

  const renderOptions = (options: Option[]) => {
    const shouldShowSelectedIndicator = shouldChangeValueOnSelect;
    return options.map(({ value, label, disabled }) => {
      return (
        <Item key={value} value={value} disabled={disabled} size={size}>
          {shouldShowSelectedIndicator && (
            <IndicatorSlot>
              <SelectPrimitive.ItemIndicator>
                <FontAwesomeIcon icon={faCheck} size="xs" />
              </SelectPrimitive.ItemIndicator>
            </IndicatorSlot>
          )}
          <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
        </Item>
      );
    });
  };

  const renderOptionGroups = (optionGroups: OptionsGroup[]) => {
    return optionGroups.map(({ label, options }, index) => {
      return (
        <Fragment key={label}>
          <SelectPrimitive.Group>
            <GroupLabel>{label}</GroupLabel>
            {renderOptions(options)}
          </SelectPrimitive.Group>
          {index < optionGroups.length - 1 && <Separator />}
        </Fragment>
      );
    });
  };

  return (
    <SelectPrimitive.Root
      onValueChange={(value) => {
        if (shouldChangeValueOnSelect) {
          setValue(value);
        }
        onSelect(value);
      }}
      value={value}
    >
      <Trigger disabled={disabled} size={size} id={id}>
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <FontAwesomeIcon
            icon={faChevronDown}
            size={size === 'small' ? 'sm' : '1x'}
          />
        </SelectPrimitive.Icon>
      </Trigger>

      <Content>
        <ScrollUpButton>
          <FontAwesomeIcon icon={faChevronUp} size="sm" />
        </ScrollUpButton>
        <SelectPrimitive.Viewport>
          {placeholder && (
            <PlaceholderItem disabled value="" size={size}>
              <SelectPrimitive.ItemText>{placeholder}</SelectPrimitive.ItemText>
            </PlaceholderItem>
          )}
          {isOptionsGroupArray(options) && renderOptionGroups(options)}
          {isOptionsArray(options) && renderOptions(options)}
        </SelectPrimitive.Viewport>
        <ScrollDownButton>
          <FontAwesomeIcon icon={faChevronDown} size="sm" />
        </ScrollDownButton>
      </Content>
    </SelectPrimitive.Root>
  );
};

type PropsForSelectGroup = BaseFormGroupProps & PropsForSelect;

export const SelectGroup = ({
  id,
  label,
  description,
  icon,
  error,
  ...props
}: PropsForSelectGroup) => {
  return (
    <FormGroup
      id={id}
      label={label}
      description={description}
      design={props.design}
    >
      {(id) => <Select id={id} {...props} />}
    </FormGroup>
  );
};
