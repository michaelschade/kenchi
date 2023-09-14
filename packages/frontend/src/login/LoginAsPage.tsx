import { useEffect } from 'react';

import { gql, useApolloClient, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';

import Loading from '@kenchi/ui/lib/Loading';

import ErrorAlert from '../components/ErrorAlert';
import { KenchiErrorFragment } from '../graphql/fragments';
import {
  LoginAsMutation,
  LoginAsMutationVariables,
} from '../graphql/generated';
import { purgeAndRedirect } from './utils';

export const LOGIN_AS = gql`
  mutation LoginAsMutation($sessionId: String) {
    modify: loginAs(sessionId: $sessionId) {
      viewer {
        user {
          id
          email
        }
      }
      error {
        ...KenchiErrorFragment
      }
    }
  }
  ${KenchiErrorFragment}
`;

export default function LoginAs() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const client = useApolloClient();

  const [doLogin, { called, error }] = useMutation<
    LoginAsMutation,
    LoginAsMutationVariables
  >(LOGIN_AS, {
    onCompleted: async (data) => {
      if (!data.modify.error) {
        purgeAndRedirect();
      }
    },
  });

  useEffect(() => {
    if (!called) {
      // Make sure we're not issuing any other queries that might race condition cookie setting
      client.stop();
      doLogin({
        variables: { sessionId: sessionId === 'return' ? null : sessionId },
      });
    }
  }, [client, doLogin, sessionId, called]);

  if (error) {
    return <ErrorAlert title="Error logging you in" error={error} />;
  } else {
    return <Loading name="login as" />;
  }
}
