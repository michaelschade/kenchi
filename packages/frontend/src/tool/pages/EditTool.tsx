import { useHistory, useParams } from 'react-router-dom';

import { trackEvent } from '../../utils/analytics';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import EditToolComponent from '../edit/EditTool';

export default function EditTool() {
  const { id, branchId } = useParams<{ id: string; branchId?: string }>();
  const history = useHistory();
  const [{ suggest }] = useSimpleQueryParams();

  if (!id) {
    throw new Error('Invalid Tool');
  }

  return (
    <EditToolComponent
      id={branchId || id}
      onBack={() => history.goBack()}
      onUpdate={(tool) => {
        trackEvent({
          category: 'tools',
          action: 'update',
          label: 'Update tool',
          object: tool.staticId,
        });
        history.push('/');
      }}
      onDelete={() => {
        trackEvent({
          category: 'tools',
          action: 'delete',
          label: 'Delete tool',
          object: id,
        });
        history.push('/');
      }}
      topLevel={true}
      editType={suggest ? 'suggestOnly' : 'normal'}
    />
  );
}
