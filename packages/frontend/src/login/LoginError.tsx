import { ApolloError } from '@apollo/client';

import ErrorAlert from '../components/ErrorAlert';
import { KenchiErrorFragment } from '../graphql/generated';
import { LoginErrorEnum } from './useLogin';

export const LoginError = ({
  error,
  disableAnimation = false,
}: {
  error: LoginErrorEnum | ApolloError | KenchiErrorFragment | null;
  disableAnimation?: boolean;
}) => {
  if (!error) {
    return null;
  }

  if (typeof error === 'object') {
    return <ErrorAlert title="Error logging you in" error={error} />;
  }

  let errorMessage = null;
  let errorContact: boolean = false;

  switch (error) {
    case LoginErrorEnum.POPUP_CLOSED:
      errorMessage = (
        <>It looks like you closed the Google popup. Please try again.</>
      );
      break;
    case LoginErrorEnum.POPUP_BLOCKED:
      errorMessage = (
        <>
          Your browser blocked the Google popup. Please try again{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={process.env.REACT_APP_HOST}
          >
            in a new window
          </a>
          .
        </>
      );
      break;
    case LoginErrorEnum.GAPI_LOAD:
      errorMessage = (
        <>
          Sorry, something unexpected went wrong communicating with Google to
          sign to Kenchi.
        </>
      );
      errorContact = true;
      break;
    case LoginErrorEnum.OTHER:
      errorMessage = (
        <>Sorry, something unexpected went wrong trying to log in to Kenchi.</>
      );
      errorContact = true;
      break;
    case LoginErrorEnum.COOKIE:
      errorMessage = (
        <>
          Your browser has disabled third party cookies, which are necessary for
          Google login to work. Please follow{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://support.google.com/chrome/answer/95647#:~:text=Allow%20or%20block%20cookies%20for%20a%20specific%20site"
          >
            these instructions
          </a>{' '}
          to allow "accounts.google.com" to set cookies, or contact your IT
          administrator.
        </>
      );
      break;
  }

  return (
    <ErrorAlert
      title="Couldn't sign in"
      error={errorMessage}
      contact={errorContact}
      disableAnimation={disableAnimation}
    />
  );
};
