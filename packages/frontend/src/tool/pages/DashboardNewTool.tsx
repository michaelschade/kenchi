import { useCallback, useState } from 'react';

import {
  delayForHideEditActionBarMs,
  editActionBarTransitionDurationMs,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { useToast } from '@kenchi/ui/lib/Toast';

import { ToolFragment } from '../../graphql/generated';
import { RecoveryProvider, useRecovery } from '../../slate/Editor/Recovery';
import { trackEvent } from '../../utils/analytics';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import DashboardToolEditor from '../edit/DashboardToolEditor';
import { useCreateTool } from '../edit/useCreateTool';
import { successMessageForToolBranchType } from './DashboardViewAndEditTool';

type Props = {
  onDone: (tool: ToolFragment) => void;
  onCancel: () => void;
};

function DashboardNewToolImpl({ onDone, onCancel }: Props) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submitButtonLabelOverride, setSubmitButtonLabelOverride] =
    useState<React.ReactNode>(null);
  const [shouldShowSuccessMessage, setShouldShowSuccessMessage] =
    useState(false);
  const [{ collectionId: defaultCollectionId }] = useSimpleQueryParams();
  const { triggerToast } = useToast();
  const { dropRecovery } = useRecovery();

  const onCreate = useCallback(
    (newTool: ToolFragment) => {
      trackEvent({
        category: 'tools',
        action: 'create',
        label: 'Created new tool',
        object: newTool.staticId,
      });
      triggerToast({
        message: successMessageForToolBranchType[newTool.branchType],
      });
      dropRecovery();
      setShouldShowSuccessMessage(true);
      setSubmitButtonLabelOverride('Success! 🎉');
      setTimeout(() => {
        setSubmitButtonLabelOverride(null);
        setShouldShowSuccessMessage(false);
        setIsRedirecting(true);
        onDone(newTool);
      }, delayForHideEditActionBarMs + editActionBarTransitionDurationMs);
    },
    [dropRecovery, onDone, triggerToast]
  );

  const onCancelWithAnalytics = () => {
    trackEvent({
      category: 'tools',
      action: 'cancel_create',
      label: 'Canceled creating tool',
    });
    setShouldShowSuccessMessage(false);
    onCancel();
  };

  const [createTool, toolCreationResult] = useCreateTool(onCreate);

  return (
    <DashboardToolEditor
      createOrModifyTool={createTool}
      defaultCollectionId={defaultCollectionId}
      onCancel={onCancelWithAnalytics}
      resultForCreateOrModify={toolCreationResult}
      shouldConfirmUnloadIfChanged={!isRedirecting}
      shouldShowSuccessMessage={shouldShowSuccessMessage}
      submitButtonLabelOverride={submitButtonLabelOverride}
    />
  );
}

export default function DashboardNewTool(props: Props) {
  return (
    <RecoveryProvider type="tool" id={null}>
      <DashboardNewToolImpl {...props} />
    </RecoveryProvider>
  );
}
