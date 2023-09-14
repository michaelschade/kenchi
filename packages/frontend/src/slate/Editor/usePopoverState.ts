import React, { useEffect, useState } from 'react';

import { Range } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { TextEditorPopover } from '@kenchi/ui/lib/Dashboard/TextEditorPopover';

// This is *close* to the right state handling, but not perfect:
// - When you press escape the popover is closed, and reopens when you type any
//   letter or move the selection. We should keep it closed since you explicitly
//   closed it.
// - When you click outside the editor the popover is closed, and reopens when
//   you type any letter or move the selection. We should reopen it when you
//   focus back into the editor.
//
// Unfortunately Radix's popover doesn't tell us if we're closed via escape or
// blur. We should disable both of these and instead manage it ourselves so we
// can differentiate.
export default function usePopoverState(
  target: Range | null
): Omit<React.ComponentPropsWithoutRef<typeof TextEditorPopover>, 'children'> {
  const editor = useSlate();

  const [forceClose, setForceClose] = useState(false);

  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (target) {
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      setTop(rect.bottom + window.scrollY);
      setLeft(rect.left + window.scrollX);
    }
    // Reset from our last esc press
    setForceClose(false);
  }, [editor, target]);

  const onChangeIsOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setForceClose(true);
    }
  };

  return {
    isOpen: !forceClose && !!target,
    onChangeIsOpen,
    top,
    left,
  };
}
