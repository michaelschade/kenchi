import { useCallback } from 'react';

import { gql, useMutation } from '@apollo/client';

import {
  SetupLoginAsMutation,
  SetupLoginAsMutationVariables,
} from '../graphql/generated';

const LOGIN_AS_MUTATION = gql`
  mutation SetupLoginAsMutation($orgId: ID, $userId: ID) {
    setupLoginAs(organizationId: $orgId, userId: $userId)
  }
`;

export default function useLoginAs() {
  const [mutate, rest] = useMutation<
    SetupLoginAsMutation,
    SetupLoginAsMutationVariables
  >(LOGIN_AS_MUTATION);
  const loginAs = useCallback(
    async (variables: SetupLoginAsMutationVariables) => {
      const res = await mutate({ variables });
      if (res.data?.setupLoginAs) {
        window.location.href = `${process.env.REACT_APP_PUBLIC_HOST}/login-as/${res.data.setupLoginAs}`;
      }
    },
    [mutate]
  );
  return [loginAs, rest] as const;
}
