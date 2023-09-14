import { useEffect, useMemo, useState } from 'react';

import ReactJson from 'react-json-view';

import { isSuccess } from '@kenchi/shared/lib/Result';
import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { useToast } from '@kenchi/ui/lib/Toast';

import useMessageRouter from '../../utils/useMessageRouter';
import { fetchGetFullResponses } from './FetchPlayback';
// import { fetchPlayback } from './FetchPlayback';
import FetchRecordingProcessor from './FetchRecordingProcessor';
import { DataSource } from './types';
import { useCreateDataSource } from './useCreateDataSource';
// import state from './tmpState.json';

export default function NewDataSource({}: {}) {
  const [processor, setProcessor] = useState<FetchRecordingProcessor | null>(
    null
  );
  const [responses, setResponses] = useState<Record<string, unknown> | null>(
    null
  );

  const [stage, setStage] = useState<'init' | 'record' | 'configure'>('init');

  const { triggerToast } = useToast();

  const onCreateDataSource = (dataSource: DataSource) => {
    triggerToast({ message: 'Data source created' });
  };

  const { create: createDataSource } = useCreateDataSource(onCreateDataSource);

  const router = useMessageRouter<'dashboard'>();

  const proposedDataSource = useMemo(() => {
    if (!processor) {
      return null;
    }
    return processor.process();
  }, [processor]);

  useEffect(() => {
    if (stage !== 'record') {
      return;
    }
    router.sendCommand('background', 'recordStart', {});
    const interval = setInterval(async () => {
      const resp = await router.sendCommand('background', 'recordProcessPoll');
      if (isSuccess(resp)) {
        setProcessor(new FetchRecordingProcessor(resp.data));
        setStage('configure');
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

  useEffect(() => {
    if (
      stage !== 'configure' ||
      !proposedDataSource ||
      !isSuccess(proposedDataSource)
    ) {
      return;
    }

    fetchGetFullResponses(
      router,
      'ty@openphone.co',
      proposedDataSource.data.requests
    ).then((responses) => setResponses(responses));
  }, [stage, proposedDataSource, router]);

  let dataSourceUI;
  if (proposedDataSource && isSuccess(proposedDataSource)) {
    dataSourceUI = (
      <>
        <h3>Responses</h3>
        {responses ? (
          <ReactJson
            src={responses}
            enableClipboard={false}
            displayDataTypes={false}
            collapsed={4}
          />
        ) : (
          'null'
        )}
        <h3>Requests</h3>
        <ReactJson
          src={proposedDataSource.data.requests}
          enableClipboard={false}
          displayDataTypes={false}
          collapsed={4}
        />
      </>
    );
  } else {
    const sendLogs = () => {
      // TODO: send debug logs
    };
    dataSourceUI = (
      <>
        We were unable to figure out how to do things from your recording. You
        can:
        <br />
        <PrimaryButton onClick={() => setStage('record')}>
          Try Again
        </PrimaryButton>
        <br />
        or
        <br />
        <PrimaryButton onClick={sendLogs}>Send us your logs</PrimaryButton>
        <br />
        <small>
          Note that these logs will include PII from your recording: any
          information you typed in or received back. This is necessary for us to
          build your data source for you, but not after that. This information
          is tightly controlled, will only be used for building your data
          source, and will be deleted from our system within one week.
        </small>
        <p>
          <small>Error: {proposedDataSource?.error}</small>
        </p>
      </>
    );
  }

  switch (stage) {
    case 'configure':
      return (
        <>
          <div>
            <PrimaryButton
              onClick={() => {
                if (!proposedDataSource || !isSuccess(proposedDataSource)) {
                  return;
                }
                createDataSource(proposedDataSource.data);
              }}
            >
              Save data source
            </PrimaryButton>
          </div>
          TODO: configuration UI
          {dataSourceUI}
          <pre>
            <code>{JSON.stringify(processor?.lastUrl)}</code>
            <code>{JSON.stringify(processor?.entries, null, 2)}</code>
          </pre>
        </>
      );
    case 'record':
      return (
        <>
          Wrong window, come back when done.
          <br />
          TODO: maybe give a "cancel" button or a "go to recording window"
          button?
        </>
      );

    case 'init':
      return (
        <>
          TODO: in addition to putting the instructions in the window that
          opens, we should also put them here.
          <br />
          <button onClick={() => setStage('record')}>Record</button>
        </>
      );
  }
}
