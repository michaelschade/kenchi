import { useState } from 'react';

import { faEllipsisH } from '@fortawesome/pro-solid-svg-icons';

import { MenuOpener } from '@kenchi/ui/lib/DropdownMenu';

import ActionButton from './ActionButton';

// Menu Action Button is an Action Button that can display the contents of a
// <Menu> UI component. We abstract away this component since there's a fair
// bit of positioning state management and logic to manage the Action
// Container state when the menu is open.

type Props = {
  children?: React.ReactNode;
  compact?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export default function MenuActionButton({
  children,
  compact,
  className,
  onOpenChange,
  open,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  return (
    <MenuOpener
      open={open ?? uncontrolledOpen}
      compact={compact}
      menuContent={children}
      onOpenChange={(open) => {
        setUncontrolledOpen(open);
        onOpenChange?.(open);
      }}
    >
      <ActionButton
        color="grey"
        active={open}
        icon={faEllipsisH}
        className={className}
      />
    </MenuOpener>
  );
}
