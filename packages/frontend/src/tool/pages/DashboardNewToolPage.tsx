import { useHistory } from 'react-router-dom';

import { ToolFragment } from '../../graphql/generated';
import DashboardNewTool from './DashboardNewTool';

export default function DashboardNewWorkflowPage() {
  const history = useHistory();
  const onDone = (tool: ToolFragment) => {
    const url = tool.branchId
      ? `/dashboard/snippets/${tool.staticId}/branch/${tool.branchId}`
      : `/dashboard/snippets/${tool.staticId}`;
    history.replace(url);
  };
  const onCancel = () => history.goBack();
  return <DashboardNewTool onDone={onDone} onCancel={onCancel} />;
}
