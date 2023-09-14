import { gql, MutationHookOptions, useMutation } from '@apollo/client';

import { useMeta } from '@kenchi/ui/lib/useMeta';

import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  NewGroupFormMutation,
  NewGroupFormMutationVariables,
} from '../../graphql/generated';
import { GroupForm } from './GroupForm';

const MUTATION = gql`
  mutation NewGroupFormMutation(
    $name: String!
    $upsertMembers: [GroupMemberInput!]!
  ) {
    modify: createGroup(name: $name, upsertMembers: $upsertMembers) {
      error {
        ...KenchiErrorFragment
      }
      group {
        id
        name
      }
    }
  }
  ${KenchiErrorFragment}
`;

type NewGroupFormProps = {
  goBack: () => void;
  mutationOptions?: MutationHookOptions<
    NewGroupFormMutation,
    NewGroupFormMutationVariables
  >;
};

export const NewGroupForm = ({
  goBack,
  mutationOptions,
}: NewGroupFormProps) => {
  const title = 'Create a new group';
  useMeta({ title });

  const [mutate, mutationResult] = useMutation<
    NewGroupFormMutation,
    NewGroupFormMutationVariables
  >(MUTATION, mutationOptions);

  return (
    <GroupForm
      group={null}
      title={title}
      goBack={goBack}
      onSubmit={({ name, memberChanges }) => {
        mutate({
          variables: {
            name,
            upsertMembers: memberChanges
              .filter((member) => !member.isDeleted)
              .map((member) => ({
                userId: member.id,
                isManager: member.isManager,
              })),
          },
        });
      }}
      mutationResult={mutationResult}
    />
  );
};
