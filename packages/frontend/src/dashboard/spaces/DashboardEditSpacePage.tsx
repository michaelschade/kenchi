import { useCallback } from 'react';

import { gql, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useToast } from '@kenchi/ui/lib/Toast';

import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { SpaceEditorFragment } from '../../graphql/fragments';
import {
  SpaceEditorFragment as SpaceEditorFragmentType,
  SpaceEditorQuery,
  SpaceEditorQueryVariables,
} from '../../graphql/generated';
import { DashboardSpaceEditor } from './DashboardSpaceEditor';
import { useModifySpace } from './useModifySpace';

const SPACE_EDITOR_QUERY = gql`
  query SpaceEditorQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      ...SpaceEditorFragment
    }
  }
  ${SpaceEditorFragment}
`;

type Props = {
  space: SpaceEditorFragmentType;
};

const DashboardEditSpacePage = ({ space }: Props) => {
  const { triggerToast } = useToast();
  const onUpdate = useCallback(
    (updatedSpace) => {
      triggerToast({ message: `Updated space: ${updatedSpace.name}` });
    },
    [triggerToast]
  );

  const [modifySpace, resultForModify] = useModifySpace(space, onUpdate);

  return (
    <DashboardSpaceEditor
      space={space}
      resultForCreateOrModify={resultForModify}
      createOrModifySpace={modifySpace}
    />
  );
};

const DashboardEditSpacePageWithGuard = () => {
  const { id: spaceId } = useParams<{ id?: string }>();
  const { data, loading, error } = useQuery<
    SpaceEditorQuery,
    SpaceEditorQueryVariables
  >(
    SPACE_EDITOR_QUERY,
    spaceId
      ? { fetchPolicy: 'network-only', variables: { staticId: spaceId } }
      : { skip: true }
  );

  const space =
    data?.versionedNode?.__typename === 'SpaceLatest'
      ? data.versionedNode
      : null;

  if (!space) {
    if (loading) {
      return <LoadingSpinner name="dashboard space editor" />;
    }
    if (error) {
      return <ErrorAlert title="Error loading space" error={error} />;
    }
    return <NotFoundAlert title="Space not found" />;
  }

  return <DashboardEditSpacePage space={space} />;
};

export default DashboardEditSpacePageWithGuard;
