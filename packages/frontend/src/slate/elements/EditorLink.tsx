import { ReactEditor, useSlate } from 'slate-react';

import { LinkElement } from '@kenchi/slate-tools/lib/types';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { linkStyle } from '@kenchi/ui/lib/Text';

import { trackEvent } from '../../utils/analytics';
import { ElementWithPopover } from '../Editor/ElementWithPopover';
import { SelectedElementPopoverContent } from '../Editor/SelectedElementPopoverContent';
import { useIsOnlyElementSelected } from '../Editor/useIsOnlyElementSelected';
import { unwrapLink } from '../Editor/withLinks';

type Props = {
  attributes: Record<string, unknown>;
  children: React.ReactNode;
  element: LinkElement;
  onClickEdit: () => void;
};

export const EditorLink = ({
  attributes,
  children,
  element,
  onClickEdit,
}: Props) => {
  const editor = useSlate();
  const isOnlyElementSelected = useIsOnlyElementSelected(element);

  return (
    <ElementWithPopover
      shouldShowPopoverIfSelected={isOnlyElementSelected}
      popoverContent={
        <SelectedElementPopoverContent
          onClickRemove={() => {
            trackEvent({
              category: 'workflow_editor',
              action: 'remove_link',
              label: 'Remove link from text',
            });
            unwrapLink(editor);
            ReactEditor.focus(editor);
          }}
          onClickEdit={() => {
            onClickEdit();
          }}
          linkDisplayText={element.url}
          linkTo={element.url}
        />
      }
    >
      <a
        {...attributes}
        css={(theme: KenchiTheme) => linkStyle(theme, { underline: false })}
        href={element.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    </ElementWithPopover>
  );
};
