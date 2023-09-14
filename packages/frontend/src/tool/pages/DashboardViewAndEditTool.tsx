import { useCallback, useState } from 'react';

import { Redirect, useHistory, useParams } from 'react-router-dom';

import {
  delayForHideEditActionBarMs,
  editActionBarTransitionDurationMs,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useToast } from '@kenchi/ui/lib/Toast';

import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { BranchTypeEnum, ToolFragment } from '../../graphql/generated';
import { RecoveryProvider, useRecovery } from '../../slate/Editor/Recovery';
import { trackEvent } from '../../utils/analytics';
import DashboardToolEditor from '../edit/DashboardToolEditor';
import { useDeleteTool } from '../edit/useDeleteTool';
import { useModifyTool } from '../edit/useModifyTool';
import { useToolFormState } from '../edit/useToolFormState';
import useTool from '../useTool';

function getBranchUrl(staticId: string, branchId: string) {
  return `/dashboard/snippets/${staticId}/branch/${branchId}`;
}

export const successMessageForToolBranchType = {
  [BranchTypeEnum.draft]: 'Snippet draft saved',
  [BranchTypeEnum.suggestion]: 'Snippet suggestion saved',
  [BranchTypeEnum.published]: 'Snippet published',
};

function DashboardViewAndEditTool({
  tool,
  fetchLoading,
}: {
  tool: ToolFragment;
  fetchLoading: boolean;
}) {
  const { hasPendingSuggestion, branchByUser } = useToolFormState(tool);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submitButtonLabelOverride, setSubmitButtonLabelOverride] =
    useState<React.ReactNode>(null);
  const [shouldShowSuccessMessage, setShouldShowSuccessMessage] =
    useState(false);
  const history = useHistory();
  const { triggerToast } = useToast();
  const { dropRecovery } = useRecovery();

  const onUpdate = useCallback(
    (updatedTool: ToolFragment) => {
      trackEvent({
        category: 'tools',
        action: 'update',
        label: 'Update tool',
        object: updatedTool.staticId,
      });
      triggerToast({
        message: successMessageForToolBranchType[updatedTool.branchType],
      });
      dropRecovery();
      const branchIdOfToolBeforeUpdate = tool?.branchId;
      const branchByUser = updatedTool.branches.edges[0]?.node;
      const shouldRedirectToBranchByUser =
        branchByUser && branchIdOfToolBeforeUpdate !== branchByUser?.branchId;
      setShouldShowSuccessMessage(true);
      setSubmitButtonLabelOverride('Success! 🎉');
      setTimeout(() => {
        setSubmitButtonLabelOverride(null);
      }, delayForHideEditActionBarMs + editActionBarTransitionDurationMs);
      const shouldRedirectToPublished =
        tool?.branchType === BranchTypeEnum.draft &&
        updatedTool.branchType === BranchTypeEnum.published;
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
          history.replace(`/dashboard/snippets/${updatedTool.staticId}`);
        }
      }, delayForHideEditActionBarMs);
    },
    [dropRecovery, history, tool?.branchId, tool?.branchType, triggerToast]
  );

  const onCancel = () => {
    // TODO: make "are you sure you want to cancel" prompt
    trackEvent({
      category: 'tools',
      action: 'cancel_edit',
      label: 'Canceled editing tool',
    });
    setShouldShowSuccessMessage(false);
  };

  const [modifyTool, modifyToolResult] = useModifyTool(tool, onUpdate);
  const [deleteTool, ConfirmDelete, deleteToolResult] = useDeleteTool(tool);

  const isDeleting = deleteToolResult.loading || deleteToolResult.data;

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
      <DashboardToolEditor
        createOrModifyTool={modifyTool}
        deleteToolResult={deleteToolResult}
        hasLatestData={!fetchLoading}
        onCancel={onCancel}
        onClickDelete={deleteTool}
        resultForCreateOrModify={modifyToolResult}
        shouldConfirmUnloadIfChanged={!isDeleting && !isRedirecting}
        shouldShowSuccessMessage={shouldShowSuccessMessage}
        submitButtonLabelOverride={submitButtonLabelOverride}
        tool={tool}
      />
    </>
  );
}

export default function WrappedDashboardViewAndEditTool() {
  const { id, branchId } = useParams<{ id: string; branchId?: string }>();
  const { tool, loading, error } = useTool(branchId || id, 'cache-and-network');

  if (!tool) {
    if (loading) {
      return <LoadingSpinner />;
    } else if (error) {
      return <ErrorAlert title="Error loading snippet" error={error} />;
    } else {
      return <NotFoundAlert title="Snippet not found" />;
    }
  }

  return (
    <RecoveryProvider type="tool" id={tool.staticId}>
      <DashboardViewAndEditTool tool={tool} fetchLoading={loading} />
    </RecoveryProvider>
  );
}
