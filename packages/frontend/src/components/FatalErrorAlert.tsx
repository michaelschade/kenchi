import { useEffect } from 'react';

import { css } from '@emotion/react';
import type { ErrorBoundary } from '@sentry/react';
import { useLocation } from 'react-router-dom';

import { linkStyle } from '@kenchi/ui/lib/Text';

import { purgeAndRedirect } from '../login/utils';
import { reloadWithLocation } from '../utils/history';
import ErrorAlert from './ErrorAlert';

type Props = Parameters<
  Extract<
    React.ComponentPropsWithoutRef<typeof ErrorBoundary>['fallback'],
    Function
  >
>[0];

export default function FatalErrorAlert({ error }: Props) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.didHitErrorBoundary = true;
  }, []);

  return (
    <div
      css={css`
        display: grid;
        padding: 1rem;
        justify-content: left;
      `}
    >
      <ErrorAlert
        title="Kenchi has crashed"
        error={
          <>
            <p>
              It looks like Kenchi has crashed! We're really sorry about that.
              We've been notified and will look into the issue ASAP.
            </p>
            <p>
              In the meantime, you can{' '}
              <a
                href={window.location.toString()}
                onClick={(e) => {
                  e.preventDefault();
                  reloadWithLocation(pathname);
                }}
              >
                reload Kenchi to try again
              </a>
              .
            </p>
            <p>
              If that doesn't work, try{' '}
              <span css={linkStyle} onClick={() => purgeAndRedirect()}>
                clearing your Kenchi cache
              </span>{' '}
              or <a href="mailto:support@kenchi.com">email us for assistance</a>
              .
            </p>
          </>
        }
      />
    </div>
  );
}
