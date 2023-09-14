import { useCallback, useState } from 'react';

import { gql, useMutation } from '@apollo/client';
import { captureException, captureMessage } from '@sentry/react';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Stack } from '@kenchi/ui/lib/Stack';
import { Link } from '@kenchi/ui/lib/Text';

import ErrorAlert from '../components/ErrorAlert';
import {
  CapturePageSnapshotQuery,
  CapturePageSnapshotQueryVariables,
} from '../graphql/generated';
import { isMessageRouterErrorType } from '../utils';
import { trackEvent } from '../utils/analytics';
import useMessageRouter from '../utils/useMessageRouter';

const MUTATION = gql`
  mutation CapturePageSnapshotQuery($snapshot: Json!) {
    sendPageSnapshot(snapshot: $snapshot)
  }
`;

export function CapturePageSnapshotLink() {
  const messageRouter = useMessageRouter<'app'>();

  const [sendFeedback] = useMutation<
    CapturePageSnapshotQuery,
    CapturePageSnapshotQueryVariables
  >(MUTATION);

  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  const capture = useCallback(async () => {
    setCapturing(true);
    try {
      await messageRouter.sendCommand('contentScript', 'injectScript', {
        name: 'domSnapshot',
      });
    } catch (e) {
      if (!isMessageRouterErrorType(e, 'alreadyInjected')) {
        throw e;
      }
    }
    let snapshot = null;
    try {
      snapshot = await messageRouter.sendCommand(
        'pageScript',
        'domSnapshotCapture'
      );
    } catch (e) {
      setCaptureError(true);
      captureException(e);
    }

    if (snapshot) {
      // Capture a message so we get log lines in case they're reporting an issue
      captureMessage('Page snapshot sent');
      trackEvent({
        category: 'feedback',
        action: 'page_snapshot',
        label: 'Submit page snapshot',
      });
      await sendFeedback({ variables: { snapshot } });
    }
    setCapturing(false);
  }, [messageRouter, sendFeedback]);

  return (
    <Stack>
      <Link onClick={() => capture()}>
        Capture page snapshot{' '}
        {capturing && <LoadingSpinner name="capture page snapshot" />}
      </Link>
      <ErrorAlert
        title="Error capturing page snapshot"
        error={
          captureError ? (
            <>
              Something unexpected happened when trying to capture the page
              snapshot.
            </>
          ) : null
        }
      />
    </Stack>
  );
}
