import { useCallback } from 'react';

import { useHistory } from 'react-router-dom';

import VersionedNodeModifyContainer from '../../components/VersionedNodeModifyContainer';
import { WorkflowFragment as WorkflowFragmentType } from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import { useCreateWorkflow } from '../useCreateWorkflow';
import WorkflowEditor from '../WorkflowEditor';

function NewWorkflow() {
  const history = useHistory();
  const [{ collectionId: defaultCollectionId }] = useSimpleQueryParams();

  const onCreate = (workflow: WorkflowFragmentType) => {
    trackEvent({
      category: 'workflows',
      action: 'create',
      label: 'Created new workflow',
      object: workflow.staticId,
    });
    const branchPath = workflow.branchId ? `/${workflow.branchId}` : '';
    history.push(`/playbooks/${workflow.staticId}${branchPath}`);
  };

  const [createWorkflow, workflowCreationResult] = useCreateWorkflow(onCreate);

  const onBack = useCallback(() => {
    trackEvent({
      category: 'workflows',
      action: 'cancel_new',
      label: 'Canceled creating new workflow',
    });
    history.goBack();
  }, [history]);

  return (
    <VersionedNodeModifyContainer
      item={null}
      onBack={() => history.goBack()}
      itemName="playbook"
      itemPath="playbooks"
      topLevel={true}
      submitError={workflowCreationResult.error}
    >
      <WorkflowEditor
        onSubmit={createWorkflow}
        onBack={onBack}
        submitLoading={workflowCreationResult.loading}
        editType="normal"
        defaultCollectionId={defaultCollectionId}
      />
    </VersionedNodeModifyContainer>
  );
}

export default NewWorkflow;
