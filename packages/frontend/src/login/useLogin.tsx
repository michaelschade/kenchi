import { useCallback, useEffect, useState } from 'react';

import { gql, useMutation } from '@apollo/client';
import { captureException } from '@sentry/react';

import { errorFromMutation } from '../graphql/errorFromMutation';
import { KenchiErrorFragment } from '../graphql/fragments';
import { LoginMutation, LoginMutationVariables } from '../graphql/generated';
import { QUERY as SETTINGS_QUERY } from '../graphql/useSettings';
import { QUERY as DOMAIN_SETTINGS_QUERY } from '../pageContext/domainSettings/useDomainSettingsQuery';
import { trackEvent } from '../utils/analytics';
import { broadcastLogin, defaultGetAuthToken, onLogin } from './utils';

export enum LoginErrorEnum {
  COOKIE = 'COOKIE',
  POPUP_CLOSED = 'POPUP_CLOSED',
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  GAPI_LOAD = 'GAPI_LOAD',
  OTHER = 'OTHER',
}

export const LOGIN = gql`
  mutation LoginMutation($token: String!) {
    modify: login(token: $token) {
      error {
        ...KenchiErrorFragment
      }
      viewer {
        user {
          id
          email
        }
      }
    }
  }
  ${KenchiErrorFragment}
`;

type AuthTokenGetter = (interactive: boolean) => Promise<string>;

type Props = {
  getAuthToken?: AuthTokenGetter;
  onSuccess: () => void;
};

export const useLogin = ({
  getAuthToken = defaultGetAuthToken,
  onSuccess,
}: Props) => {
  const [errorEnum, setErrorEnum] = useState<LoginErrorEnum | null>(null);

  // Listen for other tabs being successfully logged in
  useEffect(() => onLogin(() => onSuccess()), [onSuccess]);

  const [doLogin, loginStatus] = useMutation<
    LoginMutation,
    LoginMutationVariables
  >(LOGIN, {
    refetchQueries: [
      { query: SETTINGS_QUERY },
      { query: DOMAIN_SETTINGS_QUERY },
    ],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      if (!data.modify.error) {
        trackEvent({
          category: 'login',
          action: 'login_success',
        });
        broadcastLogin();
        onSuccess();
      }
    },
  });

  const promptForLogin = useCallback(() => {
    getAuthToken(true)
      .then((token) => {
        doLogin({ variables: { token } });
      })
      .catch((err) => {
        if (err instanceof Error) {
          if (err.message === 'third_party_cookies') {
            setErrorEnum(LoginErrorEnum.COOKIE);
          } else if (err.message === 'gapi_load_error') {
            setErrorEnum(LoginErrorEnum.GAPI_LOAD);
          }
        } else if ('error' in err && err.error === 'popup_closed_by_user') {
          setErrorEnum(LoginErrorEnum.POPUP_CLOSED);
        } else if ('error' in err && err.error === 'popup_blocked_by_browser') {
          setErrorEnum(LoginErrorEnum.POPUP_BLOCKED);
        } else {
          captureException(err);
          setErrorEnum(LoginErrorEnum.OTHER);
        }
      });
  }, [getAuthToken, doLogin]);

  const gqlError = errorFromMutation(loginStatus);
  return [
    promptForLogin,
    {
      success: loginStatus.data && !gqlError,
      loading: loginStatus.loading,
      error: errorEnum || gqlError || null,
    },
  ] as const;
};
