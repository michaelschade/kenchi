import { useEffect } from 'react';

import { gql } from '@apollo/client';
import { faTimesCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import { LinkButton } from '@kenchi/ui/lib/Button';
import { RawTable } from '@kenchi/ui/lib/Dashboard/Table';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@kenchi/ui/lib/Dialog';
import {
  FormControlsContainer,
  FormGroup,
  InputGroup,
  Switch,
} from '@kenchi/ui/lib/Form';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import { Link } from '@kenchi/ui/lib/Text';
import Tooltip from '@kenchi/ui/lib/Tooltip';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import ErrorAlert from '../../components/ErrorAlert';
import { MutateButton } from '../../components/MutateButton';
import UserSelector from '../../components/UserSelector';
import {
  errorFromMutation,
  ModifyResult,
} from '../../graphql/errorFromMutation';
import { GroupFormFragment as UserGroup } from '../../graphql/generated';

export const GroupFormFragment = gql`
  fragment GroupFormFragment on UserGroup {
    id
    name
    members(first: 1000) {
      edges {
        isManager
        node {
          id
          name
          email
        }
      }
    }
  }
`;

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  isManager: boolean;
  isUpdated: boolean;
  isDeleted: boolean;
};

type Members = {
  [userId: string]: Member;
};

type Props<GroupType> = {
  title: string;
  group: GroupType;
  goBack: () => void;
  onSubmit: (data: {
    group: GroupType;
    name: string;
    memberChanges: Member[];
  }) => void;
  mutationResult: ModifyResult;
};

export const GroupForm = <GroupType extends UserGroup | null>({
  title,
  group,
  goBack,
  onSubmit,
  mutationResult,
}: Props<GroupType>) => {
  const error = errorFromMutation(mutationResult);
  const isComplete = mutationResult.data && !error;
  useEffect(() => {
    if (isComplete) {
      goBack();
    }
  }, [goBack, isComplete]);

  const nameState = useFormState<string>(group?.name, '');

  const entries: Member[] =
    group?.members.edges.map((edge) => ({
      id: edge.node.id,
      name: edge.node.name,
      email: edge.node.email,
      isManager: edge.isManager,
      isDeleted: false,
      isUpdated: false,
    })) || [];
  const membersState = useFormState<Members>(
    Object.fromEntries(entries.map((member) => [member.id, member])),
    {}
  );

  const isValid = nameState.value !== '';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          group,
          name: nameState.value,
          memberChanges: Object.values(membersState.value).filter(
            (member) => member.isUpdated
          ),
        });
      }}
    >
      <DialogHeader>
        <h2>{title}</h2>
      </DialogHeader>
      <DialogContent>
        <ErrorAlert title="Error saving group" error={error} />
        <FormControlsContainer>
          <InputGroup
            label="Group name"
            value={nameState.value}
            onChange={(event) => nameState.set(event.target.value)}
            autoFocus
            required
          />
          <FormGroup label="Members">
            {(id) => (
              <div css={tw`grid gap-4`}>
                {Object.keys(membersState.value).length > 0 ? (
                  <RawTable>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            Manager
                            <HelpIcon
                              placement="bottom"
                              content="Group managers can add and remove group members"
                            />
                          </div>
                        </th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(membersState.value)
                        .filter((member) => !member.isDeleted)
                        .map((member, i) => (
                          <tr key={member.id}>
                            <td>{member.name}</td>
                            <td>{member.email}</td>
                            <td width="1">
                              <Switch
                                id={member.id}
                                checked={member.isManager}
                                onCheckedChange={(isManager) => {
                                  membersState.set({
                                    ...membersState.value,
                                    [member.id]: {
                                      ...member,
                                      isManager,
                                      isUpdated: true,
                                      isDeleted: false,
                                    },
                                  });
                                }}
                              />
                            </td>
                            <td width="1">
                              <Tooltip
                                placement="bottom"
                                overlay="Remove them from the group"
                              >
                                <Link
                                  onClick={() => {
                                    membersState.set({
                                      ...membersState.value,
                                      [member.id]: {
                                        ...member,
                                        isUpdated: true,
                                        isDeleted: true,
                                      },
                                    });
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTimesCircle} />
                                </Link>
                              </Tooltip>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </RawTable>
                ) : null}
                <UserSelector
                  id={id}
                  disabledIds={Object.values(membersState.value)
                    .filter((member) => !member.isDeleted)
                    .map((member) => member.id)}
                  onSelect={(userOrGroup) => {
                    if (userOrGroup.__typename === 'UserGroup') {
                      throw new Error(
                        'Group selected when options should have only included users'
                      );
                    }
                    const user = userOrGroup;
                    membersState.set({
                      ...membersState.value,
                      [user.id]: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        isManager: false,
                        isUpdated: true,
                        isDeleted: false,
                      },
                    });
                  }}
                />
              </div>
            )}
          </FormGroup>
        </FormControlsContainer>
      </DialogContent>
      <DialogFooter>
        <LinkButton type="button" onClick={() => goBack()}>
          Cancel
        </LinkButton>
        <MutateButton result={mutationResult} type="submit" disabled={!isValid}>
          Save
        </MutateButton>
      </DialogFooter>
    </form>
  );
};
