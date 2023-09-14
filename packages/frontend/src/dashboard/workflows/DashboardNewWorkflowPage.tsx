import { useHistory } from 'react-router-dom';

import { WorkflowFragment } from '../../graphql/generated';
import DashboardNewWorkflow from './DashboardNewWorkflow';

export default function DashboardNewWorkflowPage() {
  const history = useHistory();
  const onDone = (workflow: WorkflowFragment) => {
    const url = workflow.branchId
      ? `/dashboard/playbooks/${workflow.staticId}/branch/${workflow.branchId}`
      : `/dashboard/playbooks/${workflow.staticId}`;
    history.replace(url);
  };
  const onCancel = () => history.goBack();
  return <DashboardNewWorkflow onDone={onDone} onCancel={onCancel} />;
}
