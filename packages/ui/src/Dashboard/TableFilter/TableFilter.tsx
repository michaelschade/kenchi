import { useEffect, useMemo, useRef, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faCheck, faFilter } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import partition from 'lodash/partition';

import { SecondaryButton } from '../../Button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../Collapsible';
import { Popover } from '../../Popover';
import { ToggleButtonButton } from '../../ToggleButton';
import { LinkButtonWithIcon } from '../LinkWithIcon';
import { Separator } from '../Separator';
import { FilterComponent, FilterRef } from './types';

export function filterData<TItem, TConfigs extends GenericFilterConfigs<TItem>>(
  data: TItem[],
  states: FilterStates<TItem, TConfigs>,
  configs: TConfigs
): TItem[] {
  let result = data;
  Object.entries(configs).forEach(([filterKey, { filterFn, component }]) => {
    const filterState = states[filterKey];
    if (!component.shouldFilterWhenOff && !filterState?.isOn) {
      return;
    }
    const filterValue = filterState ? filterState.value : undefined;
    result = result.filter((item) => filterFn(item, filterValue));
  });
  return result;
}

const Container = styled.div`
  display: grid;
  font-size: 0.8rem;
  gap: 0.5rem;
  min-width: 230px;
`;

const TopControlsContainer = styled.div`
  align-items: center;
  display: grid;
  gap: 0.5rem;
  grid-auto-flow: column;
  justify-content: space-between;
`;

const ToggleButtonContent = styled.div`
  display: grid;
  gap: 0.5rem;
  grid-template-columns: auto 1fr;
  align-items: center;
`;

const Guidance = styled.p`
  margin: 0;
`;

/**
 * Facilitates type inference. When defining a config, wrap it in this identity
 * function so you don't need to explicitly pass the generic types. E.g.:
 *
 * const FILTER_CONFIGS = {
 *   name: filterConfig({
 *     name: 'Name',
 *     component: TextInputFilter,
 *     extraProps: { placeholder: 'Name' },
 *     filterFn: (item: ContentItem, filterValue: string | null) =>
 *       item.name.toLowerCase().includes(filterValue.toLowerCase()),
 *   }),
 * };
 **/
export const filterConfig = <TItem, TValue, TExtraProps>(
  config: FilterConfig<TItem, TValue, TExtraProps>
) => config;

export interface FilterConfig<TItem, TValue, TExtraProps> {
  filterFn: (item: TItem, value?: TValue) => boolean;
  // Why we can't use any of the React types (e.g. ForwardRefExoticComponent):
  // Type inference will make TExtraProps match whatever extraProps is, e.g. `{
  // placeholder: string }`, even if `{ placeholder?: string }` is the type of
  // the component's prop. For a pure function, as used here, Typescript won't
  // care, because the former is a subset of the latter. However, all the React
  // component types also include other uses of the Props type which are not
  // forgiving of subsets. So we pluck only the function signature.
  component: FilterComponent<TValue, TExtraProps>;
  name: string;
  extraProps: TExtraProps;
}

/**
 * You should never use this directly as the type for configs. Instead use it as
 * a generic. For example, if you want to pass configs into a React component,
 * you can do this:
 *
 *   type Props<TConfigs extends GenericFilterConfigs<...>> = {
 *     configs: TConfigs;
 *   }
 *
 * This will ensure that the typing gets appropriately constrained and minimize
 * use of `any`.
 **/
export type GenericFilterConfigs<TItem> = Record<
  string,
  FilterConfig<TItem, any, any>
>;

export type FilterState<TValue> = {
  isOn: boolean;
  value: TValue;
};

export type FilterStates<
  TItem,
  TConfigs extends GenericFilterConfigs<TItem>
> = {
  [K in keyof TConfigs]?: TConfigs[K] extends FilterConfig<
    TItem,
    infer TValue,
    any
  >
    ? FilterState<TValue>
    : never;
};

type TableFilterProps<TItem, TConfigs extends GenericFilterConfigs<TItem>> = {
  configs: TConfigs;
  states: FilterStates<TItem, TConfigs>;
  onChange: (states: FilterStates<TItem, TConfigs>) => void;
  onClose?: () => void;
};

const FilterElement = <TItem, TValue, TExtraProps>({
  component: FilterComponent,
  name,
  extraProps,
  filterState,
  onChange,
}: FilterConfig<TItem, TValue, TExtraProps> & {
  filterState: FilterState<TValue>;
  onChange: (filterState: FilterState<TValue>) => void;
}) => {
  const ref = useRef<FilterRef>(null);
  const { isOn, value } = filterState || {
    isOn: false,
    value: null,
  };

  const component = (
    <FilterComponent
      ref={ref}
      value={value}
      onChange={(newValue) => {
        onChange({
          ...filterState,
          // If the value is being set, we assume we're isOn
          isOn: true,
          value: newValue,
        });
      }}
      {...extraProps}
    />
  );

  if (FilterComponent.isInlineFilter) {
    return component;
  } else {
    return (
      <Collapsible
        open={isOn}
        onOpenChange={(isOpen: boolean) => {
          if (isOpen) {
            setTimeout(() => {
              ref.current?.focus();
            }, 0);
          }
          onChange({
            ...filterState,
            isOn: isOpen,
          });
        }}
      >
        <CollapsibleTrigger asChild>
          <ToggleButtonButton
            size="tiny"
            css={css`
              width: 100%;
            `}
          >
            <ToggleButtonContent>
              <span>{name}</span>
              {isOn && <FontAwesomeIcon icon={faCheck} size="sm" />}
            </ToggleButtonContent>
          </ToggleButtonButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            css={css`
              padding-top: 0.5rem;
            `}
          >
            {component}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
};

export const TableFilter = <
  TItem,
  TConfigs extends GenericFilterConfigs<TItem>
>({
  configs,
  states,
  onChange,
  onClose,
}: TableFilterProps<TItem, TConfigs>) => {
  const [popoverIsOpen, setPopoverIsOpen] = useState<boolean>();
  const configEntries = Object.entries(configs);
  const [inlineFilters, regularFilters] = partition(
    configEntries,
    ([, { component }]) => component.isInlineFilter
  );

  const activeFilterCount = useMemo(
    () => Object.values(states).filter((state) => state?.isOn).length,
    [states]
  );

  const popoverTrigger = (
    <LinkButtonWithIcon icon={faFilter}>
      {activeFilterCount ? `Filter | ${activeFilterCount}` : 'Filter'}
    </LinkButtonWithIcon>
  );

  const onClickClear = () => {
    const newStates = Object.entries(states).reduce(
      (acc, [key, state]) => ({
        ...acc,
        [key]: {
          ...state,
          isOn: false,
        },
      }),
      {}
    );
    onChange(newStates);
    setPopoverIsOpen(false);
  };

  useEffect(() => {
    // We need this so that onClickClear, which closes the popover via state
    // munging, also causes onClose to be called. We cannot call it directly
    // within the callback because we need to wait an update cycle so that the
    // newStates can be propagated to the callback, since onClose is often used
    // to update query params.
    if (popoverIsOpen === false) {
      onClose?.();
    }
  }, [popoverIsOpen, onClose]);

  const popoverContent = (
    <Container>
      <TopControlsContainer>
        <Guidance>Filter by...</Guidance>
        <SecondaryButton
          disabled={!activeFilterCount}
          onClick={onClickClear}
          size="tiny"
        >
          Clear
        </SecondaryButton>
      </TopControlsContainer>
      {regularFilters.map(([key, config]) => (
        <FilterElement
          key={key}
          {...config}
          filterState={states[key] || { isOn: false, value: null }}
          onChange={(newState) => {
            onChange({
              ...states,
              [key]: newState,
            });
          }}
        />
      ))}
      {regularFilters.length > 0 && inlineFilters.length > 0 && <Separator />}
      {inlineFilters.map(([key, config]) => (
        <FilterElement
          key={key}
          {...config}
          filterState={states[key] || { isOn: false, value: null }}
          onChange={(newState) => {
            onChange({
              ...states,
              [key]: newState,
            });
          }}
        />
      ))}
    </Container>
  );

  return (
    <Popover
      trigger={popoverTrigger}
      content={popoverContent}
      isOpen={!!popoverIsOpen}
      onOpenChange={setPopoverIsOpen}
    />
  );
};
