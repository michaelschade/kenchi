import { useCallback, useState } from 'react';

import { useHistory } from 'react-router-dom';

import { useToast } from '@kenchi/ui/lib/Toast';

import { SpaceEditorFragment as SpaceEditorFragmentType } from '../../graphql/generated';
import { DashboardSpaceEditor } from './DashboardSpaceEditor';
import { useCreateSpace } from './useCreateSpace';

type Props = {
  space: SpaceEditorFragmentType;
};

const DashboardNewSpacePage = ({ space }: Props) => {
  const history = useHistory();
  const { triggerToast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const onCreate = useCallback(
    (newSpace) => {
      triggerToast({ message: `Created space: ${newSpace.name}` });
      setIsRedirecting(true);
      history.replace(`/dashboard/spaces/${newSpace.staticId}`);
    },
    [history, triggerToast]
  );

  const [createSpace, spaceCreationResult] = useCreateSpace(onCreate);

  return (
    <DashboardSpaceEditor
      space={space}
      resultForCreateOrModify={spaceCreationResult}
      createOrModifySpace={createSpace}
      shouldConfirmUnloadIfChanged={!isRedirecting}
    />
  );
};

export default DashboardNewSpacePage;
