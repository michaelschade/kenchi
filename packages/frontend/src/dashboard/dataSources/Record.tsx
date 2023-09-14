import { useEffect, useState } from 'react';

import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';

import { isSuccess } from '@kenchi/shared/lib/Result';
import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import {
  SendRecordingMutation,
  SendRecordingMutationVariables,
} from '../../graphql/generated';
import useMessageRouter from '../../utils/useMessageRouter';

const MUTATION = gql`
  mutation SendRecordingMutation($snapshot: Json!) {
    sendPageSnapshot(snapshot: $snapshot)
  }
`;

export default function RecordDataSourcePage() {
  const [recording, setRecording] = useState<any>();
  const [stage, setStage] = useState<'init' | 'record' | 'send'>('init');

  const router = useMessageRouter<'dashboard'>();

  useEffect(() => {
    if (stage !== 'record') {
      return;
    }
    router.sendCommand('background', 'recordStart', {});
    const interval = setInterval(async () => {
      const resp = await router.sendCommand('background', 'recordProcessPoll');
      if (isSuccess(resp)) {
        setRecording(resp.data);
        setStage('send');
      } else {
        switch (resp.error) {
          case 'not_finished':
            // NOOP
            break;
          case 'no_active_recording':
            // TODO: message error
            setStage('init');
            break;
          case 'window_closed':
            // TODO: message error
            setStage('init');
            break;
        }
      }
    }, 200);
    return () => {
      clearInterval(interval);
    };
  }, [stage, router]);

  const [sendRecording, { loading, data }] = useMutation<
    SendRecordingMutation,
    SendRecordingMutationVariables
  >(MUTATION);
  const sendLogs = () => {
    sendRecording({ variables: { snapshot: recording } });
  };

  switch (stage) {
    case 'send':
      return (
        <>
          Thanks for recording! Now send us your logs and we can do cool things
          with them:
          <br />
          {loading ? (
            <LoadingSpinner />
          ) : (
            <PrimaryButton onClick={sendLogs}>Send us your logs</PrimaryButton>
          )}
          {data?.sendPageSnapshot && 'Sent'}
        </>
      );
    case 'record':
      return <>Wrong window, come back when done.</>;

    case 'init':
      return (
        <PrimaryButton onClick={() => setStage('record')}>Record</PrimaryButton>
      );
  }
}
