import { useEffect, useState } from 'react';

import { Path } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { SlateElement } from '@kenchi/slate-tools/lib/types';

export const useIsOnlyElementSelected = (element: SlateElement) => {
  const editor = useSlate();
  const [isOnlyElementSelected, setIsOnlyElementSelected] = useState(false);
  useEffect(() => {
    const path = ReactEditor.findPath(editor, element);
    if (editor.selection) {
      setIsOnlyElementSelected(
        Path.endsAt(path, editor.selection.anchor.path) &&
          Path.endsAt(path, editor.selection.focus.path)
      );
    } else {
      setIsOnlyElementSelected(false);
    }
  }, [editor, editor.selection, element]);

  return isOnlyElementSelected;
};
