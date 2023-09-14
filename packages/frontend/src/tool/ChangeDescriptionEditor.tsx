import { SlateNode } from '@kenchi/slate-tools/lib/types';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import { Popover } from '@kenchi/ui/lib/Popover';

import { RecoveryEditor } from '../slate/Editor/Recovery';

type ChangeDescriptionEditorProps = {
  isOpen: boolean;
  value: SlateNode[];
  onChange: (newValue: SlateNode[]) => void;
  helpText: string;
};

export const ChangeDescriptionEditor = ({
  isOpen,
  value,
  onChange,
  helpText,
}: ChangeDescriptionEditorProps) => {
  const changeAlertEditorTitle = (
    <div>
      <span>Add Change Alert</span>
      <HelpIcon placement="top" content={helpText} />
    </div>
  );

  return (
    <Popover
      // We intentionally omit the `onOpenChange` prop here, to make the popover
      // only close when the MultiButton selection changes away from publishAndAlert,
      // rather than say, closing upon interacting outside of the popover.
      // TODO: Allow interaction outside to close the popover, but make sure we switch
      // the MultiButton's selection away from publishAndAlert, also don't close the
      // popover when clicking on the MultiButton's menu, even though that's outside
      // of the popover.
      align="start"
      isOpen={isOpen}
      shouldFocusOnOpen={false}
      content={
        <ContentCard title={changeAlertEditorTitle}>
          <RecoveryEditor
            recoveryKey="majorChange"
            style={{ minHeight: '8rem', width: '20rem' }}
            spellCheck
            withFormatting
            withImages
            withURLLinks
            size="small"
            value={value}
            onChange={onChange}
          />
        </ContentCard>
      }
    />
  );
};
