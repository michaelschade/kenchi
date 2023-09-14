import { useCallback, useState } from 'react';

import { Redirect, useHistory, useParams } from 'react-router-dom';

import {
  delayForHideEditActionBarMs,
  editActionBarTransitionDurationMs,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useToast } from '@kenchi/ui/lib/Toast';

import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { BranchTypeEnum, WorkflowFragment } from '../../graphql/generated';
import { RecoveryProvider, useRecovery } from '../../slate/Editor/Recovery';
import { trackEvent } from '../../utils/analytics';
import DashboardWorkflowEditor from '../../workflow/DashboardWorkflowEditor';
import { useDeleteWorkflow } from '../../workflow/useDeleteWorkflow';
import { useModifyWorkflow } from '../../workflow/useModifyWorkflow';
import useWorkflow from '../../workflow/useWorkflow';
import { useWorkflowFormState } from '../../workflow/useWorkflowFormState';

function getBranchUrl(staticId: string, branchId: string) {
  return `/dashboard/playbooks/${staticId}/branch/${branchId}`;
}

export const successMessageForWorkflowBranchType = {
  [BranchTypeEnum.draft]: 'Playbook draft saved',
  [BranchTypeEnum.suggestion]: 'Playbook suggestion saved',
  [BranchTypeEnum.published]: 'Playbook published',
};

export const DashboardViewAndEditWorkflow = ({
  workflow,
  fetchLoading,
}: {
  workflow: WorkflowFragment;
  fetchLoading: boolean;
}) => {
  const { hasPendingSuggestion, branchByUser } = useWorkflowFormState(workflow);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submitButtonLabelOverride, setSubmitButtonLabelOverride] =
    useState<React.ReactNode>(null);
  const [shouldShowSuccessMessage, setShouldShowSuccessMessage] =
    useState(false);
  const history = useHistory();
  const { triggerToast } = useToast();
  const { dropRecovery } = useRecovery();

  const onUpdate = useCallback(
    (updatedWorkflow: WorkflowFragment) => {
      trackEvent({
        category: 'workflows',
        action: 'update',
        label: 'Update workflow',
        object: updatedWorkflow.staticId,
      });
      triggerToast({
        message:
          successMessageForWorkflowBranchType[updatedWorkflow.branchType],
      });
      dropRecovery();
      const branchIdOfWorkflowBeforeUpdate = workflow?.branchId;
      const branchByUser = updatedWorkflow.branches.edges[0]?.node;
      const shouldRedirectToBranchByUser =
        branchByUser &&
        branchIdOfWorkflowBeforeUpdate !== branchByUser?.branchId;
      setShouldShowSuccessMessage(true);
      setSubmitButtonLabelOverride('Success! 🎉');

      setTimeout(() => {
        setSubmitButtonLabelOverride(null);
      }, delayForHideEditActionBarMs + editActionBarTransitionDurationMs);
      const shouldRedirectToPublished =
        workflow?.branchType === BranchTypeEnum.draft &&
        updatedWorkflow.branchType === BranchTypeEnum.published;
      setTimeout(() => {
        setShouldShowSuccessMessage(false);
        if (shouldRedirectToBranchByUser) {
          setIsRedirecting(true);
          history.push(
            getBranchUrl(branchByUser.staticId, branchByUser.branchId!)
          );
        }
        if (shouldRedirectToPublished) {
          setIsRedirecting(true);
          history.replace(`/dashboard/playbooks/${updatedWorkflow.staticId}`);
        }
      }, delayForHideEditActionBarMs);
    },
    [
      dropRecovery,
      history,
      triggerToast,
      workflow?.branchId,
      workflow?.branchType,
    ]
  );

  const onCancel = () => {
    trackEvent({
      category: 'workflows',
      action: 'cancel_edit',
      label: 'Canceled editing workflow',
    });
    setShouldShowSuccessMessage(false);
  };

  const [modifyWorkflow, modifyWorkflowResult] = useModifyWorkflow(
    workflow,
    onUpdate
  );
  const [deleteWorkflow, ConfirmDelete, deleteWorkflowResult] =
    useDeleteWorkflow(workflow);

  const isDeleting = deleteWorkflowResult.loading || deleteWorkflowResult.data;

  if (!fetchLoading && hasPendingSuggestion && branchByUser?.branchId) {
    return (
      <Redirect
        to={getBranchUrl(branchByUser.staticId, branchByUser.branchId)}
      />
    );
  }

  return (
    <>
      <ConfirmDelete />
      <DashboardWorkflowEditor
        workflow={workflow}
        workflowIsLoading={fetchLoading}
        createOrModifyWorkflow={modifyWorkflow}
        shouldConfirmUnloadIfChanged={!isDeleting && !isRedirecting}
        submitButtonLabelOverride={submitButtonLabelOverride}
        resultForCreateOrModify={modifyWorkflowResult}
        deleteWorkflowResult={deleteWorkflowResult}
        shouldShowSuccessMessage={shouldShowSuccessMessage}
        onCancel={onCancel}
        onClickDelete={deleteWorkflow}
      />
    </>
  );
};

export default function WrappedDashboardViewAndEditWorkflow() {
  const { id, branchId } = useParams<{ id: string; branchId?: string }>();
  const { workflow, loading, error } = useWorkflow(
    branchId || id,
    'cache-and-network'
  );

  if (!workflow) {
    if (loading) {
      return <LoadingSpinner />;
    } else if (error) {
      return <ErrorAlert title="Error loading playbook" error={error} />;
    } else {
      return <NotFoundAlert title="Playbook not found" />;
    }
  }

  return (
    <RecoveryProvider
      type="workflow"
      id={workflow.staticId}
      key={workflow.staticId}
    >
      <DashboardViewAndEditWorkflow
        workflow={workflow}
        fetchLoading={loading}
      />
    </RecoveryProvider>
  );
}
