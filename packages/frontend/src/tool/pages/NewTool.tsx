import { useHistory, useLocation } from 'react-router-dom';

import { trackEvent } from '../../utils/analytics';
import { State } from '../../utils/history';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import NewToolComponent from '../edit/NewTool';

export default function NewTool() {
  const history = useHistory();
  const [{ collectionId: defaultCollectionId, type }] = useSimpleQueryParams();
  const location = useLocation<State>();
  return (
    <NewToolComponent
      topLevel={true}
      onBack={() => {
        history.goBack();
        trackEvent({
          category: 'tools',
          action: 'cancel_new',
          label: 'Canceled creating new tool',
        });
      }}
      onCreate={(tool) => {
        trackEvent({
          category: 'tools',
          action: 'create',
          label: 'Created new tool',
          object: tool.staticId,
        });
        history.push('/');
      }}
      defaultCollectionId={defaultCollectionId}
      defaultComponent={type === 'link' ? 'OpenURLs' : undefined}
      proposedSnippet={location.state?.proposedSnippet}
    />
  );
}
