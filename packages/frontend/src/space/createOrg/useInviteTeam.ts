import { useCallback, useRef, useState } from 'react';

import { useMutation } from '@apollo/client';
import { GraphQLError } from 'graphql';
import gql from 'graphql-tag';

import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  InviteUserMutation,
  InviteUserMutationVariables,
  KenchiErrorFragment as KenchiErrorFragmentType,
} from '../../graphql/generated';

export type CreateUserResult = {
  success: boolean;
  error?: GraphQLError | KenchiErrorFragmentType | Error;
};

const INVITE_USER_MUTATION = gql`
  mutation InviteUserMutation($email: String!) {
    createUser(email: $email) {
      error {
        ...KenchiErrorFragment
      }
      user {
        id
        email
      }
    }
  }

  ${KenchiErrorFragment}
`;

export default function useInviteTeam() {
  const [createUser] = useMutation<
    InviteUserMutation,
    InviteUserMutationVariables
  >(INVITE_USER_MUTATION);
  const results = useRef<Record<string, CreateUserResult>>({});
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (emails: string[]) => {
      setLoading(true);
      await Promise.all(
        emails.map((email) =>
          (async () => {
            try {
              const res = await createUser({ variables: { email } });
              if (res.data?.createUser.user) {
                results.current[email] = { success: true };
              } else {
                results.current[email] = {
                  success: false,
                  error:
                    res.errors?.[0] || res.data?.createUser.error || undefined,
                };
              }
            } catch (e) {
              if (e instanceof Error) {
                results.current[email] = {
                  success: false,
                  error: e,
                };
              } else {
                throw e;
              }
            }
          })()
        )
      );
      setLoading(false);
      return results.current;
    },
    [createUser]
  );

  const resetResults = useCallback(() => {
    results.current = {};
  }, []);

  return [run, { loading, results: results.current, resetResults }] as const;
}
