import { Fragment, ReactNode, useEffect, useState } from 'react';

import { css, keyframes } from '@emotion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { baseFormControl, LabelWithDescription } from '@kenchi/ui/lib/Form';
import { useHotkeyRegion } from '@kenchi/ui/lib/useHotkey';

export type Option = {
  label: string;
  value: string;
  isGroup?: never;
};

type OptionGroup = {
  isGroup: true;
  label: string;
};

type GroupedOption = Option | OptionGroup;

type Props = {
  label: string;
  description: string;
  title: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  itemComponent?: React.ComponentType<{ option?: Option }>;
  button?: ReactNode;
  disabled?: boolean;
};

const styleButton = css`
  ${tw`w-full block text-left`}
  height: auto !important; /* reject shared baseFormControl height */
`;

export const MenuSheet = ({
  label,
  description,
  title,
  options,
  value,
  onChange,
  itemComponent: ItemComponent,
  button,
  disabled,
}: Props) => {
  const enterRegion = useHotkeyRegion();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      return enterRegion();
    }
  }, [enterRegion, open]);

  const selectedOption = options.find((option) => option.value === value);
  const [groupedOptions, setGroupedOptions] =
    useState<GroupedOption[]>(options);

  useEffect(() => {
    setGroupedOptions(groupOptions(options));
  }, [options]);

  return (
    <>
      {label && (
        <LabelWithDescription label={label} description={description} />
      )}
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger
          disabled={disabled}
          css={css`
            background: transparent;
            border: none;
            padding: 0;
            width: 100%;
          `}
        >
          {button || (
            <div css={[styleButton, baseFormControl]}>
              {ItemComponent ? (
                <ItemComponent option={selectedOption} />
              ) : (
                selectedOption?.label
              )}
            </div>
          )}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content css={styleMenu}>
          <div css={styleHeader}>{title}</div>
          <div css={styleScrollable}>
            <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
              {groupedOptions.map((option) =>
                option.isGroup ? (
                  <div key={option.label} css={styleMenuGroup}>
                    {option.label}
                  </div>
                ) : (
                  <DropdownMenu.RadioItem
                    value={option.value}
                    key={option.label}
                    css={styleMenuItem}
                  >
                    {ItemComponent ? (
                      <ItemComponent option={option} />
                    ) : (
                      option.label
                    )}
                  </DropdownMenu.RadioItem>
                )
              )}
            </DropdownMenu.RadioGroup>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </>
  );
};

const styleHeader = css`
  ${tw`px-2 py-2 font-bold`}
`;

const animateIn = keyframes`
  from {
    ${tw`scale-95 opacity-0`}
  }
  to {
    ${tw`scale-100 opacity-100`}
  }
`;

// We don't do leave transitions because onChange causes the menu to dismiss,
// but you can see a quick flash of selected states render as its transitioning
// out.

const styleMenu = ({ colors }: KenchiTheme) => css`
  ${tw`absolute mt-2 w-64 text-base`}
  z-index: 99; /* 1 more than editor toolbar */

  &[data-state='open'] {
    animation: ${animateIn} 100ms ease-out;
  }

  ${tw`rounded shadow-sm border border-solid focus:outline-none p-0`}
  border-color: ${colors.gray[7]};
  background-color: ${colors.gray[1]};
  color: ${colors.gray[12]};
`;

const styleScrollable = ({ colors }: KenchiTheme) => css`
  ${tw`overflow-y-auto py-1 border-solid border-t border-b-0 border-r-0 border-l-0`}
  max-height: 60vh;
  border-color: ${colors.gray[7]};
`;

const styleMenuItem = ({ colors }: KenchiTheme) => css`
  ${tw`py-1 px-3 cursor-pointer focus:outline-none mb-0`}

  opacity: 1;
  pointer-events: auto;

  &:hover {
    background-color: ${colors.gray[3]};
  }

  &:focus-visible {
    background-color: ${colors.gray[3]};
  }

  &[data-state='checked'] {
    opacity: 0.3;
    pointer-events: none;
  }
`;

const styleMenuGroup = css`
  ${tw`px-3 pt-3 pb-1 font-semibold opacity-50`}
`;

// sort into groups, assume options are sorted already
function groupOptions(options: Option[]) {
  const newGroupedOptions: GroupedOption[] = [];
  const ungroupedOptions: GroupedOption[] = [];
  options.forEach((option) => {
    const groupedOption = splitDelimeter(option.label);
    if (groupedOption.length > 1) {
      const group = groupedOption[0];
      const isGroupInserted =
        newGroupedOptions.findIndex(
          (opt) => opt.label === group && opt.isGroup
        ) >= 0;
      if (!isGroupInserted) {
        newGroupedOptions.push({
          label: group,
          isGroup: true,
        });
      }
      newGroupedOptions.push({
        label: groupedOption[1],
        value: option.value,
      });
    } else {
      ungroupedOptions.push(option);
    }
  });
  return [...ungroupedOptions, ...newGroupedOptions];
}

const DELIMETERS = [' - ', '/', ' — '];

function splitDelimeter(label: string) {
  for (let i = 0; i < DELIMETERS.length; i++) {
    if (label.indexOf(DELIMETERS[i]) > 0) {
      return label.split(DELIMETERS[i]).map((s) => s.trim());
    }
  }
  return [label];
}
