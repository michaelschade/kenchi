import { useState } from 'react';

import { gql, MutationResult, useLazyQuery, useMutation } from '@apollo/client';
import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';

import { DangerButton, PrimaryButton } from '@kenchi/ui/lib/Button';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable } from '@kenchi/ui/lib/Dashboard/Table';
import { InputGroup } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import {
  QueueBackfillMutation,
  QueueBackfillMutationVariables,
  QueueConfigureSearchIndexMutation,
  QueueReindexMutation,
  RequeueQuery,
  RequeueUnprocessedLogsMutation,
  RequeueUnprocessedLogsMutationVariables,
  UpdateDemoAccountMutation,
  UpdateDemoAccountMutationVariables,
} from '../graphql/generated';
import useDemoOrg from '../utils/useDemoOrg';

const QUERY = gql`
  query RequeueQuery {
    admin {
      unprocessedLogs {
        day
        count
      }
    }
  }
`;

const BACKFILL_MUTATION = gql`
  mutation QueueBackfillMutation($start: Int!, $end: Int!) {
    queueBackfill(start: $start, end: $end)
  }
`;

function Backfill() {
  const [start, setStart] = useState(NaN);
  const [end, setEnd] = useState(NaN);
  const [backfill, { loading, data }] = useMutation<
    QueueBackfillMutation,
    QueueBackfillMutationVariables
  >(BACKFILL_MUTATION);
  return (
    <ContentCard title="Backfill">
      Warning: not idempotent, will create multiple entries
      {data && (data.queueBackfill ? 'Success' : 'Error')}
      <InputGroup
        label="Start ID"
        value={isNaN(start) ? '' : start}
        onChange={(e) => setStart(parseInt(e.target.value))}
      />
      <InputGroup
        label="End ID (not inclusive)"
        value={isNaN(end) ? '' : end}
        onChange={(e) => setEnd(parseInt(e.target.value))}
      />
      <PrimaryButton
        onClick={() => backfill({ variables: { start, end } })}
        disabled={
          loading || isNaN(start) || isNaN(end) || start <= 0 || end <= start
        }
      >
        Backfill
      </PrimaryButton>
    </ContentCard>
  );
}

function MutateButton({
  onClick,
  result,
  disabled,
  children,
  ButtonType = PrimaryButton,
}: {
  onClick: () => void;
  result: MutationResult<{ result: boolean }>;
  disabled?: boolean;
  children: React.ReactNode;
  ButtonType?: React.ElementType<React.ButtonHTMLAttributes<HTMLButtonElement>>;
}) {
  const { data, loading, error } = result;
  let icon = null;
  if (loading) {
    icon = <LoadingSpinner />;
  } else if (error) {
    icon = <FontAwesomeIcon icon={faExclamationTriangle} />;
  }
  return (
    <>
      <ButtonType
        onClick={onClick}
        disabled={disabled || loading || data?.result}
      >
        {children}
        {icon && <> {icon}</>}
      </ButtonType>
      {error && <div>Error: {error.message}</div>}
      {data && <div>{data.result ? 'Success' : 'Failure'}</div>}
    </>
  );
}

const UPDATE_DEMO_ACCOUNT_MUTATION = gql`
  mutation UpdateDemoAccountMutation($from: DateTime!) {
    result: updateDemoAccount(from: $from)
  }
`;

function UpdateDemoAccount() {
  const { data } = useDemoOrg();
  const demoOrg = data?.admin?.organization;

  const fromState = useFormState<DateTime | undefined>(
    demoOrg ? DateTime.fromISO(demoOrg.updatedAt).plus({ days: 1 }) : undefined,
    undefined
  );

  const [run, result] = useMutation<
    UpdateDemoAccountMutation,
    UpdateDemoAccountMutationVariables
  >(UPDATE_DEMO_ACCOUNT_MUTATION);

  return (
    <ContentCard title="Demo data">
      <InputGroup
        label="Populate usage/insights from"
        description="A future date will still reset content, it just won't make new usage"
        type="date"
        value={fromState.value?.toFormat('yyyy-MM-dd') || ''}
        onChange={(e) =>
          fromState.set(DateTime.fromFormat(e.target.value, 'yyyy-MM-dd'))
        }
        style={{ width: '200px' }}
      />
      <MutateButton
        onClick={() => run({ variables: { from: fromState.value!.toISO() } })}
        disabled={!fromState.value}
        result={result}
      >
        Update Demo Account
      </MutateButton>
    </ContentCard>
  );
}

const CONFIGURE_SEARCH_INDEX_MUTATION = gql`
  mutation QueueConfigureSearchIndexMutation {
    result: queueConfigureSearchIndex
  }
`;

function ConfigureSearchIndex() {
  const [run, result] = useMutation<QueueConfigureSearchIndexMutation>(
    CONFIGURE_SEARCH_INDEX_MUTATION
  );
  return (
    <ContentCard title="Configure searchable fields and their precedence">
      <MutateButton onClick={() => run()} result={result}>
        Configure Search Index
      </MutateButton>
    </ContentCard>
  );
}

const REINDEX_MUTATION = gql`
  mutation QueueReindexMutation {
    result: queueReindexAll
  }
`;

function Reindex() {
  const [run, result] = useMutation<QueueReindexMutation>(REINDEX_MUTATION);
  return (
    <ContentCard title="Reindex all playbooks and snippets">
      <MutateButton
        onClick={() => run()}
        result={result}
        ButtonType={DangerButton}
      >
        Reindex Everything
      </MutateButton>
    </ContentCard>
  );
}

const REQUEUE_LOGS_MUTATION = gql`
  mutation RequeueUnprocessedLogsMutation($day: DateTime!) {
    requeueUnprocessedLogs(day: $day)
  }
`;

function RequeueLogs() {
  const [check, { data, loading, error }] = useLazyQuery<RequeueQuery>(QUERY);
  const [requeueLogs, { data: requeueLogsData, loading: requeueLogsLoading }] =
    useMutation<
      RequeueUnprocessedLogsMutation,
      RequeueUnprocessedLogsMutationVariables
    >(REQUEUE_LOGS_MUTATION, {
      refetchQueries: [{ query: QUERY }],
      awaitRefetchQueries: true,
    });

  if (!data && !loading && !error) {
    return (
      <ContentCard title="Logs">
        {' '}
        <PrimaryButton onClick={() => check()}>
          Find unprocessed logs
        </PrimaryButton>
      </ContentCard>
    );
  } else if (!data?.admin) {
    return (
      <ContentCard title="Logs">
        {loading ? <LoadingSpinner /> : <>Error: {JSON.stringify(error)}</>}
      </ContentCard>
    );
  }

  return (
    <ContentCard fullBleed title="Logs">
      {requeueLogsData && (
        <div>
          Last log requeue affected {requeueLogsData.requeueUnprocessedLogs}{' '}
          logs
        </div>
      )}
      <RawTable>
        <thead>
          <tr>
            <th>Day</th>
            <th>Unprocessed rows</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.admin.unprocessedLogs.map(({ day, count }) => (
            <tr key={day}>
              <td>{DateTime.fromISO(day).toFormat('ff')}</td>
              <td>{count}</td>
              <td>
                <PrimaryButton
                  size="tiny"
                  type="button"
                  disabled={requeueLogsLoading}
                  onClick={() => requeueLogs({ variables: { day } })}
                >
                  Requeue
                </PrimaryButton>
              </td>
            </tr>
          ))}
        </tbody>
      </RawTable>
    </ContentCard>
  );
}

export default function BigButtons() {
  return (
    <PageContainer
      heading="BigButtons"
      subheading="That do things you may want to do"
    >
      <Backfill />
      <UpdateDemoAccount />
      <ConfigureSearchIndex />
      <Reindex />
      <RequeueLogs />
    </PageContainer>
  );
}
