import { ReactNode, useEffect, useState } from 'react';

import { css } from '@emotion/react';
import { useFocused, useSelected } from 'slate-react';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Popover } from '@kenchi/ui/lib/Popover';

export const selectableElementStyle = ({ colors }: KenchiTheme) => css`
  border: 1px solid transparent;
  margin: -0.125rem;
  padding: 0.125rem;
  transition: all 0.15s ease-in-out;
  border-radius: 0.25rem;
  background-color: 'transparent';
  -webkit-appearance: none; // overrides style set by Reboot.css when Radix sets type="button"

  &:hover {
    background-color: ${colors.accent[2]};
    border: 1px solid ${colors.accent[7]};
  }

  &[data-selected='true'] {
    background-color: ${colors.accent[3]};
    border: 1px solid ${colors.accent[9]};
  }
`;

type Props = {
  popoverContent: ReactNode;
  children: ReactNode;
  elementIsInline?: boolean;
  shouldShowPopoverIfSelected: boolean;
};

export const ElementWithPopover = ({
  popoverContent,
  children,
  elementIsInline = true,
  shouldShowPopoverIfSelected,
}: Props) => {
  const selected = useSelected();
  const focused = useFocused();

  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const TriggerWrapper = elementIsInline ? 'span' : 'div';

  useEffect(() => {
    // We need a little timeout here because when Slate gets refocused, it
    // doesn't immediately update `selected`. That changes a wee bit after
    // `focused` changes. Without the timeout, a previously selected element's
    // popover would momentarily reopen upon clicking back into the editor, no
    // matter where.
    const timeout = setTimeout(() => {
      setPopoverIsOpen(shouldShowPopoverIfSelected && selected && focused);
    }, 10);
    return () => clearTimeout(timeout);
  }, [selected, focused, shouldShowPopoverIfSelected]);
  return (
    <Popover
      align="center"
      content={popoverContent}
      isOpen={popoverIsOpen}
      placement="top"
      shouldCloseOnInteractOutside={false}
      shouldFocusOnOpen={false}
      trigger={
        <TriggerWrapper
          css={selectableElementStyle}
          onClick={() => {
            if (shouldShowPopoverIfSelected && selected && !popoverIsOpen) {
              setPopoverIsOpen(true);
            }
          }}
          data-selected={selected && focused ? 'true' : 'false'}
        >
          {children}
        </TriggerWrapper>
      }
    />
  );
};
