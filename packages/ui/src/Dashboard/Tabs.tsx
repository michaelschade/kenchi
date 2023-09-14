import { ReactNode, useEffect, useRef, useState } from 'react';

import { css, SerializedStyles } from '@emotion/react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { KenchiTheme } from '../Colors';
import { Pill } from './Pill';

export type TabOption = {
  label: ReactNode;
  count?: number;
  value: string;
  queryParamValue?: string;
  disabled?: boolean;
};

const baseTabsListStyle = (orientation: 'vertical' | 'horizontal') => css`
  display: flex;
  flex-wrap: nowrap;
  font-size: 1rem;
  font-weight: 600;
  gap: 1rem;
  line-height: 1.5rem;
  position: relative;
  flex-direction: ${orientation === 'vertical' ? 'column' : 'row'};
`;

const alignItemsForAlignTabLabels = {
  right: 'flex-end',
  left: 'flex-start',
  center: 'center',
};

const contentCardTabsListStyle =
  (
    orientation: 'vertical' | 'horizontal',
    alignTabLabels: 'left' | 'right' | 'center'
  ) =>
  ({ colors }: KenchiTheme) =>
    css`
      border: 0px solid;
      border-bottom-width: ${orientation === 'horizontal' ? '2px' : '0px'};
      border-right-width: ${orientation === 'vertical' ? '2px' : '0px'};
      border-color: ${colors.gray[6]};
      font-size: 0.875rem;
      gap: 0;
      line-height: 1.25rem;
      align-items: ${alignItemsForAlignTabLabels[alignTabLabels]};
      height: ${orientation === 'vertical' ? '100%' : ''};
    `;

const baseTabStyle = ({ colors }: KenchiTheme) => css`
  color: ${colors.gray[11]};
  align-items: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  font-weight: 600;
  gap: 0.5rem;
  outline: none;
  padding: 0;
  transition: color 150ms ease-in-out;
  user-select: none;

  &:hover,
  &:focus-visible {
    color: ${colors.accent[9]};
  }

  &[data-state='active'] {
    color: ${colors.accent[9]};
  }

  &[data-disabled] {
    color: ${colors.gray[8]};
    cursor: auto;
  }
`;

const contentCardTabStyle = (orientation: 'horizontal' | 'vertical') => css`
  padding: ${orientation === 'vertical'
    ? '0.5rem 0.75rem'
    : '0.5rem 1rem 0.25rem 1rem'};
`;

const selectionIndicatorBaseStyle = ({ colors }: KenchiTheme) => css`
  background-color: ${colors.accent[9]};
  position: absolute;
`;

const selectionIndicatorHorizontalStyle = css`
  height: 2px;
  left: 0;
  bottom: -2px;
  transition: width 150ms ease-in-out, left 150ms ease-in-out;
`;

const selectionIndicatorVerticalStyle = css`
  width: 2px;
  top: 0;
  right: -2px;
  transition: height 150ms ease-in-out, top 150ms ease-in-out;
`;

type TabsProps = {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  forContentCard?: boolean;
  orientation?: 'horizontal' | 'vertical';
  alignTabLabels?: 'left' | 'right' | 'center';
  extraTabsListStyle?: SerializedStyles;
};

export const Tabs = ({
  options,
  onChange,
  value,
  forContentCard = false,
  orientation = 'horizontal',
  alignTabLabels = 'left',
  extraTabsListStyle,
}: TabsProps) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selectedTabElem, setSelectedTabElem] =
    useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (value && tabRefs.current[value]) {
      setSelectedTabElem(tabRefs.current[value]);
    }
  }, [value]);

  return (
    <TabsPrimitive.Root
      onValueChange={onChange}
      value={value}
      orientation={orientation}
    >
      <TabsPrimitive.List
        css={[
          baseTabsListStyle(orientation),
          forContentCard
            ? contentCardTabsListStyle(orientation, alignTabLabels)
            : null,
          extraTabsListStyle,
        ]}
      >
        {options.map((option) => (
          <TabsPrimitive.Trigger
            disabled={option.disabled}
            css={[
              baseTabStyle,
              forContentCard ? contentCardTabStyle(orientation) : null,
            ]}
            ref={(ref) => (tabRefs.current[option.value] = ref)}
            value={option.value}
            key={option.value}
          >
            {option.label}
            {option.count != null && <Pill>{option.count}</Pill>}
          </TabsPrimitive.Trigger>
        ))}
        <div
          css={[
            selectionIndicatorBaseStyle,
            orientation === 'vertical'
              ? selectionIndicatorVerticalStyle
              : selectionIndicatorHorizontalStyle,
            selectedTabElem && orientation === 'horizontal'
              ? css`
                  left: ${selectedTabElem.offsetLeft}px;
                  width: ${selectedTabElem.offsetWidth}px;
                `
              : null,
            selectedTabElem && orientation === 'vertical'
              ? css`
                  top: ${selectedTabElem.offsetTop}px;
                  height: ${selectedTabElem.offsetHeight}px;
                `
              : null,
          ]}
        />
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
};

export const ContentCardTabs = (props: TabsProps) => (
  <Tabs {...props} forContentCard={true} />
);
