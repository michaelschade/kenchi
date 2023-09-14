import { isValidElement, useEffect } from 'react';

import { ApolloError } from '@apollo/client';
import { css, SerializedStyles } from '@emotion/react';
import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHistory, useLocation } from 'react-router-dom';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';

import { KenchiErrorFragment } from '../graphql/generated';
import useSettings from '../graphql/useSettings';
import { trackEvent } from '../utils/analytics';

const alertAnimation = css`
  animation: error 6s linear;

  @keyframes error {
    0% {
      transform: translateX(0);
    }
    1% {
      transform: translateX(12px);
    }
    3% {
      transform: translateX(-10px);
    }
    5% {
      transform: translateX(10px);
    }
    7% {
      transform: translateX(-8px);
    }
    9% {
      transform: translateX(6px);
    }
    11% {
      transform: translateX(-4px);
    }
    13% {
      transform: translateX(2px);
    }
    15% {
      transform: translateX(-1px);
    }
    17% {
      transform: translateX(1px);
    }
    19% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(0);
    }
  }
`;

const iconStyle = css`
  font-size: 0.8em;
  top: 6px !important;
`;

export function NotFoundAlert({ title }: { title: string }) {
  const settings = useSettings();
  const history = useHistory();
  const location = useLocation();
  if (settings && !settings.viewer.user) {
    history.push(`/login?to=${location.pathname}`);
  }
  return (
    <ErrorAlert
      title={title}
      error={
        {
          __typename: 'KenchiError',
          type: 'validationError',
          code: 'notFound',
          message:
            "We're sorry, we were unable to find the page you were looking for. We've been notified, but please also feel free to reach out to us at support@kenchi.com if you have any questions.",
          param: null,
        } as KenchiErrorFragment
      }
    />
  );
}

type ErrorAlertProps = {
  title?: string;
  error:
    | KenchiErrorFragment
    | ApolloError
    | null
    | undefined
    | true
    | React.ReactElement;
  contact?: boolean;
  analyticsMessage?: string;
  style?: SerializedStyles;
  disableAnimation?: boolean;
};
export default function ErrorAlert({
  title,
  error,
  style,
  contact,
  analyticsMessage,
  disableAnimation,
}: ErrorAlertProps) {
  let inferredContact;
  let message: string | React.ReactElement | null = null;
  if (error) {
    if (error === true) {
      // ErrorAlert is built to conditionally render iff error is set, so you
      // can pass it a response from a GQL query without having to wrap it in a
      // conditional. However, sometimes you want to force it to render, in
      // which case you can pass in `true`.
      message = null;
    } else if (isValidElement(error)) {
      message = error;
    } else if (
      typeof error === 'object' &&
      '__typename' in error &&
      error.__typename === 'KenchiError' &&
      error.message
    ) {
      message = error?.message;
    } else {
      // ApolloError
      message =
        "We're sorry, something went wrong communicating with Kenchi :( We've been notified, but please also feel free to try again.";
      inferredContact = true;
    }
  }

  useEffect(() => {
    if (error) {
      let label = analyticsMessage;
      if (!label && message) {
        if (typeof message === 'string') {
          label = message;
        } else {
          try {
            label = JSON.stringify(message);
          } catch (e) {
            label = message.toString();
          }
        }
      }
      trackEvent({
        category: 'errors',
        action: 'show',
        title,
        label,
      });
    }
  }, [error, title, analyticsMessage, message]);

  if (!error) {
    return null;
  }
  const containerStyle: SerializedStyles[] = [];
  if (style) {
    containerStyle.push(style);
  }
  if (!disableAnimation) {
    containerStyle.push(alertAnimation);
  }
  return (
    <Alert
      primaryColor={BaseColors.error}
      title={title || 'Something went wrong…'}
      icon={<FontAwesomeIcon icon={faExclamationTriangle} css={iconStyle} />}
      containerStyle={containerStyle}
      description={
        <>
          {message}
          {(contact || inferredContact) && (
            <>
              {' '}
              If this error continues, please contact us at{' '}
              <a href="mailto:support@kenchi.com">support@kenchi.com</a>.
            </>
          )}
        </>
      }
    />
  );
}
