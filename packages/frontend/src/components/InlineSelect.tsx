import { useEffect, useState } from 'react';

import { css, keyframes } from '@emotion/react';
import { faCaretDown, faCheck } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { useHotkeyRegion } from '@kenchi/ui/lib/useHotkey';

const styleContainer = css`
  ${tw`inline-block relative`}
`;

const styleButton = ({ colors }: KenchiTheme) => css`
  all: unset;
  ${tw`border-0 border-solid border-b-2 border-opacity-20 cursor-pointer`}
  border-color: ${colors.gray[6]};

  > .icon {
    ${tw`ml-1 text-opacity-20`}
    color: ${colors.gray[12]};
  }

  &:focus {
    ${tw`outline-none`}
  }

  &:hover {
    &,
    > .icon {
      color: ${colors.gray[12]};
    }
  }
`;

const slideDownAndFadeIn = keyframes`
  from {
    ${tw`opacity-0 transform origin-top-right scale-y-95`}
  }
  to {
    ${tw`opacity-100 transform origin-top-right scale-100`}
  }
`;

// We don't do leave transitions because onChange causes the menu to dismiss,
// but you can see a quick flash of selected states render as its transitioning
// out.

const styleMenu = ({ colors }: KenchiTheme) => css`
  z-index: 1;

  &[data-state='open'] {
    animation: ${slideDownAndFadeIn} 150ms ease-in-out forwards;
  }

  ${tw`rounded py-1 shadow-md ring-1 ring-black ring-opacity-5 text-right`}

  background-color: ${colors.gray[1]};
`;

const styleMenuItem = ({ colors }: KenchiTheme) => css`
  ${tw`px-2 leading-relaxed whitespace-nowrap`}
  color: ${colors.accent[9]};

  &:focus:not([data-disabled]):not([data-state='checked']) {
    cursor: pointer;
    background-color: ${colors.gray[3]};
    color: ${colors.accent[10]};
  }
  &[data-disabled],
  &[data-state='checked'] {
    cursor: default;
    color: ${colors.gray[10]};
  }

  &:focus {
    ${tw`outline-none`}
  }

  > span > .icon {
    ${tw`mr-1`}
  }
`;

type Option = {
  label: string;
  value: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

export const InlineSelect = ({ options, value, onChange }: Props) => {
  const enterRegion = useHotkeyRegion();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      return enterRegion();
    }
  }, [enterRegion, open]);

  const selectedOption = options.find((option) => option.value === value);

  if (!selectedOption) {
    throw new Error('InlineSelect value must match an option value');
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} css={styleContainer}>
      <DropdownMenu.Trigger css={styleButton}>
        {selectedOption.label}
        <FontAwesomeIcon icon={faCaretDown} className="icon" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content css={styleMenu} align="end">
        <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
          {options.map(({ label, value }) => (
            <DropdownMenu.RadioItem
              value={value}
              key={value}
              css={styleMenuItem}
            >
              <DropdownMenu.ItemIndicator>
                <FontAwesomeIcon
                  fixedWidth
                  icon={faCheck}
                  size="xs"
                  className="icon"
                />
              </DropdownMenu.ItemIndicator>
              {label}
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
