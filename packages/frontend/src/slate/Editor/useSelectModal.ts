import { useCallback, useRef, useState } from 'react';

import { captureMessage } from '@sentry/react';
import isEqual from 'fast-deep-equal';
import { Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { trackEvent } from '../../utils/analytics';

export default function useSelectModal(field: string) {
  const [show, setShow] = useState(false);
  const editorSelection = useRef<Range>();
  const editor = useSlate();

  const open = useCallback(() => {
    if (editor.selection) {
      editorSelection.current = editor.selection;
    }
    trackEvent({
      category: 'workflow_editor',
      action: `open_modal_insert_${field}`,
      label: `Open modal to insert ${field}`,
    });
    setShow(true);
    return editorSelection.current;
  }, [editor, field]);

  const close = useCallback(() => {
    if (editorSelection.current) {
      Transforms.select(editor, editorSelection.current);
      if (!isEqual(editorSelection.current, editor.selection)) {
        captureMessage('Editor selection mismatch', {
          level: 'info',
          extra: {
            actualEditorSelection: JSON.stringify(editor.selection),
            storedEditorSelection: JSON.stringify(editorSelection),
          },
        });
      }
    }

    ReactEditor.toDOMNode(editor, editor).focus({ preventScroll: true });
    editorSelection.current = undefined;
    // Don't track analytics event here for close because we want to
    // attribute it to the close button or insert action
    setShow(false);
  }, [editor, editorSelection]);

  const onMouseDown = useCallback(() => {
    editorSelection.current = editor.selection ?? undefined;
  }, [editor]);

  return {
    show,
    open,
    close,
    onMouseDown,
    editorSelection: editorSelection.current,
  };
}
