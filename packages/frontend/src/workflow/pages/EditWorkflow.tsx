import { useCallback } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import Loading from '@kenchi/ui/lib/Loading';

import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import VersionedNodeModifyContainer from '../../components/VersionedNodeModifyContainer';
import {
  BranchTypeEnum,
  WorkflowFragment as WorkflowFragmentType,
} from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';
import { sendToView } from '../../utils/history';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import { useDeleteWorkflow } from '../useDeleteWorkflow';
import { useModifyWorkflow } from '../useModifyWorkflow';
import useWorkflow from '../useWorkflow';
import WorkflowEditor from '../WorkflowEditor';

export default function EditWorkflow() {
  const { id, branchId } = useParams<{ id: string; branchId?: string }>();
  const history = useHistory();
  const [{ suggest }] = useSimpleQueryParams();

  const {
    workflow,
    loading: fetchLoading,
    error: fetchError,
  } = useWorkflow(branchId || id, 'network-only');

  const isSuggestion = workflow?.branchType === BranchTypeEnum.suggestion;
  const editType = suggest ? 'suggestOnly' : 'normal';
  const canDelete = editType === 'normal';
  const itemName = isSuggestion ? 'suggestion' : 'playbook';

  const onUpdate = (workflow: WorkflowFragmentType) => {
    trackEvent({
      category: 'workflows',
      action: 'update',
      label: 'Update workflow',
      object: workflow.staticId,
    });
    sendToView(history, workflow);
  };

  const onBack = () => {
    trackEvent({
      category: 'workflows',
      action: 'cancel_edit',
      label: 'Canceled editing workflow',
    });
    history.goBack();
  };

  const [modifyWorkflow, modifyWorkflowResult] = useModifyWorkflow(
    workflow,
    onUpdate
  );
  const [deleteWorkflow, ConfirmDelete, deleteWorkflowResult] =
    useDeleteWorkflow(
      workflow,
      useCallback(() => history.goBack(), [history])
    );

  if (!id) {
    throw new Error('Invalid Playbook');
  }

  if (!workflow) {
    if (fetchLoading) {
      return <Loading name="edit workflow" />;
    } else if (fetchError) {
      return <ErrorAlert title="Error loading playbook" error={fetchError} />;
    } else {
      return <NotFoundAlert title="Playbook not found" />;
    }
  }

  if (workflow.staticId !== id) {
    return <NotFoundAlert title="Playbook not found, ID is not valid" />;
  }

  return (
    <>
      <ConfirmDelete />
      <VersionedNodeModifyContainer
        onBack={onBack}
        item={workflow}
        itemName={itemName}
        itemPath="playbooks"
        topLevel={true}
        submitError={modifyWorkflowResult.error}
        onClickArchive={canDelete ? deleteWorkflow : undefined}
        deleteStatus={deleteWorkflowResult}
      >
        <WorkflowEditor
          workflow={workflow}
          onSubmit={modifyWorkflow}
          onBack={onBack}
          submitLoading={modifyWorkflowResult.loading}
          shouldWarn={
            !(deleteWorkflowResult.loading || deleteWorkflowResult.data)
          }
          editType={editType}
        />
      </VersionedNodeModifyContainer>
    </>
  );
}
