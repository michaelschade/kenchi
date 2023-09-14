import { useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import {
  ToggleGroupMultipleProps,
  ToggleGroupSingleProps,
} from '@radix-ui/react-toggle-group';

import { BaseButton } from './Button';

const VerticalRoot = styled(ToggleGroupPrimitive.Root)`
  position: relative;
  display: grid;
  grid-auto-flow: row;
  grid-gap: 0.5rem;
`;

const HorizontalRoot = styled(ToggleGroupPrimitive.Root)`
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 0.5rem;
`;

export const ToggleButtonButton = styled(BaseButton)`
  text-align: left;
  z-index: 1;

  &[data-state='on'],
  &[data-state='open'] {
    background-color: ${({ theme }) => theme.colors.accent[5]};
  }

  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.accent[8]};
    box-shadow: 0 0 0 0.2rem ${({ theme }) => theme.colors.accent[7]};
    outline: 0;
  }

  &[data-state='off']:hover:not([disabled]),
  &[data-state='closed']:hover:not([disabled]),
  &[data-state='off']:focus,
  &[data-state='closed']:focus {
    background-color: ${({ theme }) => theme.colors.accent[5]};
  }

  &[data-state='on']:hover,
  &[data-state='open']:hover,
  &[data-state='on']:focus,
  &[data-state='open']:focus {
    background-color: ${({ theme }) => theme.colors.accent[5]};
  }

  &:disabled {
    opacity: 0.65;
  }
`;

const ToggleButtonGroupButton = styled(ToggleButtonButton)`
  &[data-state='on'] {
    background-color: transparent;
  }

  &[data-state='on']:hover,
  &[data-state='on']:focus-visible {
    background-color: ${({ theme }) => theme.colors.accentWithAlpha[5]};
  }
`;

type ToggleButtonProps = TogglePrimitive.ToggleProps & {
  size?: 'tiny' | 'small';
};

export const ToggleButton = ({
  children,
  size,
  ...rest
}: ToggleButtonProps) => {
  return (
    <TogglePrimitive.Root asChild {...rest}>
      <ToggleButtonButton size={size}>{children}</ToggleButtonButton>
    </TogglePrimitive.Root>
  );
};

const allowsMultipleToggled = (
  props: ToggleGroupMultipleProps | ToggleGroupSingleProps
): props is ToggleGroupMultipleProps => {
  return props.type === 'multiple';
};

type ToggleGroupItemConfig = {
  label: string;
  value: string;
  disabled?: boolean;
};

type ToggleButtonGroupProps = (
  | ToggleGroupMultipleProps
  | ToggleGroupSingleProps
) & {
  items: ToggleGroupItemConfig[];
  size?: 'tiny' | 'small';
};

const SelectedIndicator = styled.div<{
  top: number;
  left: number;
  width: number;
  height: number;
}>`
  background-color: ${({ theme }) => theme.colors.accent[5]};
  border-radius: 0.25rem;
  height: ${({ height }) => height}px;
  position: absolute;
  transition: transform 0.28s ease-out;
  width: ${({ width }) => width}px;
`;

const VerticalSelectedIndicator = styled(SelectedIndicator)`
  left: ${({ left }) => left}px;
  top: 0;
  transform: ${({ top }) => `translateY(${top}px)`};
`;

const HorizontalSelectedIndicator = styled(SelectedIndicator)`
  left: 0;
  top: ${({ top }) => top}px;
  transform: ${({ left }) => `translateX(${left}px)`};
`;

export const ToggleButtonGroup = (props: ToggleButtonGroupProps) => {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selectedItemElem, setSelectedItemElem] =
    useState<HTMLButtonElement | null>(null);
  const selectedRect = useMemo(
    () => selectedItemElem?.getBoundingClientRect(),
    [selectedItemElem]
  );

  useEffect(() => {
    if (
      !allowsMultipleToggled(props) &&
      props.value &&
      itemRefs.current[props.value]
    ) {
      setSelectedItemElem(itemRefs.current[props.value]);
    }
  }, [props]);

  const RootComponent =
    props.orientation === 'vertical' ? VerticalRoot : HorizontalRoot;

  if (allowsMultipleToggled(props)) {
    const { items, size, ...rest } = props;
    return (
      <RootComponent {...rest}>
        {items.map(({ label, value, disabled }) => (
          <ToggleGroupPrimitive.Item
            asChild
            key={value}
            value={value}
            disabled={disabled}
          >
            <ToggleButtonGroupButton size={size}>
              {label}
            </ToggleButtonGroupButton>
          </ToggleGroupPrimitive.Item>
        ))}
      </RootComponent>
    );
  }
  const { items, size, orientation, ...rest } = props;
  const SelectedIndicatorComponent =
    orientation === 'vertical'
      ? VerticalSelectedIndicator
      : HorizontalSelectedIndicator;

  return (
    <RootComponent orientation={orientation} {...rest}>
      {selectedRect && selectedItemElem && (
        <SelectedIndicatorComponent
          top={selectedItemElem.offsetTop}
          height={selectedRect.height}
          width={selectedItemElem.offsetWidth}
          left={selectedItemElem.offsetLeft}
        />
      )}
      {items.map(({ label, value: itemValue, disabled }) => (
        <ToggleGroupPrimitive.Item
          asChild
          ref={(ref) => (itemRefs.current[itemValue] = ref)}
          key={itemValue}
          value={itemValue}
          disabled={disabled}
        >
          <ToggleButtonGroupButton size={size}>{label}</ToggleButtonGroupButton>
        </ToggleGroupPrimitive.Item>
      ))}
    </RootComponent>
  );
};
