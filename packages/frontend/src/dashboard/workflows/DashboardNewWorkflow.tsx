import { useCallback, useState } from 'react';

import {
  delayForHideEditActionBarMs,
  editActionBarTransitionDurationMs,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { useToast } from '@kenchi/ui/lib/Toast';

import { WorkflowFragment } from '../../graphql/generated';
import { RecoveryProvider, useRecovery } from '../../slate/Editor/Recovery';
import { trackEvent } from '../../utils/analytics';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import DashboardWorkflowEditor from '../../workflow/DashboardWorkflowEditor';
import { useCreateWorkflow } from '../../workflow/useCreateWorkflow';
import { successMessageForWorkflowBranchType } from './DashboardViewAndEditWorkflow';

type Props = {
  onDone: (workflow: WorkflowFragment) => void;
  onCancel: () => void;
};

const DashboardNewWorkflowImpl = ({ onDone, onCancel }: Props) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submitButtonLabelOverride, setSubmitButtonLabelOverride] =
    useState<React.ReactNode>(null);
  const [shouldShowSuccessMessage, setShouldShowSuccessMessage] =
    useState(false);
  const [{ collectionId: defaultCollectionId }] = useSimpleQueryParams();
  const { triggerToast } = useToast();
  const { dropRecovery } = useRecovery();

  const onCreate = useCallback(
    (newWorkflow: WorkflowFragment) => {
      trackEvent({
        category: 'workflows',
        action: 'create',
        label: 'Created new workflow',
        object: newWorkflow.staticId,
      });
      triggerToast({
        message: successMessageForWorkflowBranchType[newWorkflow.branchType],
      });
      dropRecovery();
      setShouldShowSuccessMessage(true);
      setSubmitButtonLabelOverride('Success! 🎉');
      setTimeout(() => {
        setSubmitButtonLabelOverride(null);
        setShouldShowSuccessMessage(false);
        setIsRedirecting(true);
        onDone(newWorkflow);
      }, delayForHideEditActionBarMs + editActionBarTransitionDurationMs);
    },
    [dropRecovery, onDone, triggerToast]
  );

  const onCancelWithAnalytics = () => {
    trackEvent({
      category: 'workflows',
      action: 'cancel_create',
      label: 'Canceled creating workflow',
    });
    setShouldShowSuccessMessage(false);
    onCancel();
  };

  const [createWorkflow, resultFromCreateWorkflow] =
    useCreateWorkflow(onCreate);

  return (
    <DashboardWorkflowEditor
      createOrModifyWorkflow={createWorkflow}
      defaultCollectionId={defaultCollectionId}
      shouldConfirmUnloadIfChanged={!isRedirecting}
      submitButtonLabelOverride={submitButtonLabelOverride}
      resultForCreateOrModify={resultFromCreateWorkflow}
      shouldShowSuccessMessage={shouldShowSuccessMessage}
      onCancel={onCancelWithAnalytics}
    />
  );
};

export default function DashboardNewWorkflow(props: Props) {
  return (
    <RecoveryProvider type="workflow" id={null}>
      <DashboardNewWorkflowImpl {...props} />
    </RecoveryProvider>
  );
}
