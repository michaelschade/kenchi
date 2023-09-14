import {
  gql,
  MutationHookOptions,
  useMutation,
  useQuery,
} from '@apollo/client';

import { DialogContent } from '@kenchi/ui/lib/Dialog';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useMeta } from '@kenchi/ui/lib/useMeta';

import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  EditGroupFormMutation,
  EditGroupFormMutationVariables,
  EditGroupFormQuery,
  EditGroupFormQueryVariables,
} from '../../graphql/generated';
import { GroupForm, GroupFormFragment } from './GroupForm';

const QUERY = gql`
  query EditGroupFormQuery($id: ID!) {
    node(id: $id) {
      ... on UserGroup {
        ...GroupFormFragment
      }
    }
  }
  ${GroupFormFragment}
`;

const MUTATION = gql`
  mutation EditGroupFormMutation(
    $id: ID!
    $name: String!
    $upsertMembers: [GroupMemberInput!]
    $removeMembers: [ID!]
  ) {
    modify: updateGroup(
      id: $id
      name: $name
      upsertMembers: $upsertMembers
      removeMembers: $removeMembers
    ) {
      error {
        ...KenchiErrorFragment
      }
      group {
        ...GroupFormFragment
      }
    }
  }
  ${GroupFormFragment}
  ${KenchiErrorFragment}
`;

type Props = {
  goBack: () => void;
  groupId: string;
  mutationOptions?: MutationHookOptions<
    EditGroupFormMutation,
    EditGroupFormMutationVariables
  >;
};

export const EditGroupForm = ({ goBack, groupId, mutationOptions }: Props) => {
  const title = 'Edit group';
  useMeta({ title });

  const { data, loading, error } = useQuery<
    EditGroupFormQuery,
    EditGroupFormQueryVariables
  >(QUERY, { variables: { id: groupId } });

  const group = data?.node?.__typename === 'UserGroup' ? data.node : undefined;

  const [mutate, mutationResult] = useMutation<
    EditGroupFormMutation,
    EditGroupFormMutationVariables
  >(MUTATION, mutationOptions);

  if (loading) {
    return (
      <DialogContent>
        <LoadingSpinner name="dashboard edit group form" />
      </DialogContent>
    );
  }
  if (error) {
    return (
      <DialogContent>
        <ErrorAlert title="Error while fetching group" error={error} />
      </DialogContent>
    );
  }
  if (!group) {
    return (
      <DialogContent>
        <NotFoundAlert title="Group not found" />
      </DialogContent>
    );
  }

  return (
    <GroupForm
      title={title}
      group={group}
      goBack={goBack}
      onSubmit={({ group, name, memberChanges }) => {
        mutate({
          variables: {
            id: group.id,
            name,
            upsertMembers: memberChanges
              .filter((member) => !member.isDeleted)
              .map((member) => ({
                userId: member.id,
                isManager: member.isManager,
              })),
            removeMembers: memberChanges
              .filter((member) => member.isDeleted)
              .map((member) => member.id),
          },
        });
      }}
      mutationResult={mutationResult}
    />
  );
};
