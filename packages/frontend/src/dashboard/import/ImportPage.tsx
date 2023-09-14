import { useEffect, useRef, useState } from 'react';

import { gql, useMutation, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import xor from 'lodash/xor';
import { DateTime } from 'luxon';
import { useParams } from 'react-router-dom';
import tw from 'twin.macro';
import { useDebounce } from 'use-debounce';

import Alert from '@kenchi/ui/lib/Alert';
import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { BaseColors, KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable } from '@kenchi/ui/lib/Dashboard/Table';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Stack } from '@kenchi/ui/lib/Stack';

import CollectionSelector from '../../collection/CollectionSelector';
import ConfirmPageUnload from '../../components/ConfirmPageUnload';
import ErrorAlert from '../../components/ErrorAlert';
import { errorFromMutation } from '../../graphql/errorFromMutation';
import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  CreateToolMutation,
  ImportPageMutation,
  ImportPageMutationVariables,
  ImportPageQuery,
  ImportPageQueryVariables,
} from '../../graphql/generated';
import { useHasOrgPermission } from '../../graphql/useSettings';
import parseImport, { ImportEntry } from '../../importers';
import NotFound from '../../pages/NotFound';
import { importEntry } from './importEntry';
import { ImportRow } from './ImportRow';
import { useBatch } from './useBatch';

const QUERY = gql`
  query ImportPageQuery($id: ID!) {
    node(id: $id) {
      ... on DataImport {
        id
        createdAt
        type
        initialData
        startedAt
        completedAt
        state
      }
    }
  }
`;

const MUTATION = gql`
  mutation ImportPageMutation($id: ID!, $state: Json, $isComplete: Boolean!) {
    modify: updateDataImport(id: $id, state: $state, isComplete: $isComplete) {
      error {
        ...KenchiErrorFragment
      }
      dataImport {
        id
        completedAt
        state
      }
    }
  }
  ${KenchiErrorFragment}
`;

// TODO: move this type to GraphQL?
export type ImportState = {
  id: string;
  state: 'invalid' | 'skipped' | 'ready' | 'pending' | 'complete' | 'error';
  result: { id: string; staticId: string } | undefined;
  error: string | undefined;
};

const typeNameMap = {
  intercom: 'Intercom',
  csv: 'CSV',
  textExpander: 'TextExpander',
  zendesk: 'Zendesk',
};

export const ImportPage = () => {
  const { id } = useParams<{ id: string }>();
  const [skippedEntries, setSkippedEntries] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState<string>('');

  const canManageOrgShortcuts = useHasOrgPermission('manage_org_shortcuts');

  const { data, loading, error } = useQuery<
    ImportPageQuery,
    ImportPageQueryVariables
  >(QUERY, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const [mutate, mutationResult] = useMutation<
    ImportPageMutation,
    ImportPageMutationVariables
  >(MUTATION);

  const dataImport = data?.node?.__typename === 'DataImport' ? data.node : null;

  // Initial entries will never change once set, though dataImport will because
  // of other properties. Make sure we only parse it on initial load.
  const entriesRef = useRef<ImportEntry[]>([]);
  useEffect(() => {
    if (dataImport) {
      entriesRef.current = parseImport(dataImport.type, dataImport.initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataImport?.type]);
  const entries = entriesRef.current;

  const [startBatch, batchStates] =
    useBatch<NonNullable<CreateToolMutation['modify']['tool']>>();

  // Periodically update backend's import state as batch states change
  const [debouncedBatchStates] = useDebounce(batchStates, 1000);
  useEffect(() => {
    if (dataImport?.completedAt || !debouncedBatchStates) {
      return;
    }

    const importState = entries.map((entry): ImportState => {
      let state: ImportState['state'];
      let result;
      let error;

      if (!entry.slate.success) {
        state = 'invalid';
        error = entry.slate.error;
      } else if (skippedEntries.includes(entry.id)) {
        state = 'skipped';
      } else {
        const batchState = debouncedBatchStates.find(
          (state) => state.key === entry.id
        );
        state = batchState?.state || 'ready';
        result =
          batchState?.state === 'complete'
            ? {
                id: batchState.result.id,
                staticId: batchState.result.staticId,
              }
            : undefined;
        error =
          batchState?.state === 'error' ? batchState.error.message : undefined;
      }

      return {
        id: entry.id,
        state,
        result,
        error,
      };
    });
    const isComplete = !importState.some(
      (state) => state.state === 'pending' || state.state === 'ready'
    );

    mutate({ variables: { id, state: importState, isComplete } });
  }, [id, skippedEntries, entries, mutate, debouncedBatchStates, dataImport]);

  if (error) {
    return <ErrorAlert title="Error loading import" error={error} />;
  }

  if (loading && !data) {
    return <LoadingSpinner name="dashboard import page" />;
  }

  if (!dataImport) {
    return <NotFound />;
  }

  const entriesToImport = entries.filter(
    (entry) => entry.slate.success && !skippedEntries.includes(entry.id)
  );
  const isValid = !!(collectionId && entriesToImport.length);
  const isPending = batchStates?.some((entry) => entry.state === 'pending');
  const runAt = dataImport.completedAt || dataImport.startedAt;
  const canRun = !runAt && !isPending;

  return (
    <PageContainer
      meta={{ title: 'Import' }}
      heading={`Import from ${typeNameMap[dataImport.type]}`}
    >
      {batchStates && dataImport.startedAt && !dataImport.completedAt ? (
        <ConfirmPageUnload />
      ) : null}

      {runAt && !isPending ? (
        <Alert
          title="Import complete!"
          description={
            <>
              Data imports can only be run once. This import was run{' '}
              {DateTime.fromISO(runAt).toRelative()}. To start another import,
              open Kenchi from within Intercom (Ctrl+Space) and click "Settings"
              at the bottom of the app.
            </>
          }
          primaryColor={BaseColors.success}
          icon={<FontAwesomeIcon icon={faCheckCircle} size="sm" />}
        />
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (collectionId) {
            mutate({ variables: { id, isComplete: false } }).then(() => {
              startBatch(
                entriesToImport.map((entry) => ({
                  key: entry.id,
                  createPromise: () =>
                    importEntry(entry, collectionId, !!canManageOrgShortcuts),
                }))
              );
            });
          }
        }}
      >
        <Stack gap={6}>
          {/* Wrap this in a position: relative container so the collection selector doesn't take over the whole screen width */}
          {/* TODO: make this better */}
          <div css={tw`relative`}>
            <CollectionSelector
              label="Collection to import into"
              value={collectionId}
              onChange={setCollectionId}
              disabled={!canRun}
            />
          </div>

          <Stack gap={4}>
            <div>
              <div>Saved replies to import</div>
              <div
                css={({ colors }: KenchiTheme) => css`
                  color: ${colors.gray[11]};
                  ${tw`text-sm`}
                `}
              >
                You can uncheck any saved replies you do not want to import
              </div>
            </div>
            <ContentCard fullBleed>
              <RawTable size="sm">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Contents</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isEntryValid = entry.slate.success;
                    const checked =
                      isEntryValid && !skippedEntries.includes(entry.id);

                    return (
                      <ImportRow
                        key={entry.id}
                        entry={entry}
                        batchState={batchStates?.find(
                          (state) => state.key === entry.id
                        )}
                        importState={dataImport.state?.find(
                          (state: any) => state.id === entry.id
                        )}
                        disabled={!canRun || !isEntryValid}
                        checked={checked}
                        onChange={() =>
                          setSkippedEntries(xor(skippedEntries, [entry.id]))
                        }
                      />
                    );
                  })}
                </tbody>
              </RawTable>
            </ContentCard>
          </Stack>

          <div css={tw`sticky bottom-0 bg-white w-full p-4`}>
            <Stack gap={8}>
              <div css={tw`flex gap-2 items-center`}>
                <PrimaryButton type="submit" disabled={!canRun || !isValid}>
                  <span css={tw`flex gap-2 items-center`}>
                    Import
                    {isPending && <LoadingSpinner />}
                  </span>
                </PrimaryButton>
                {isPending && (
                  <span>
                    {batchStates?.filter((entry) => entry.state === 'complete')
                      .length || 0}{' '}
                    of {batchStates?.length || 0}
                  </span>
                )}
              </div>
              <ErrorAlert error={errorFromMutation(mutationResult)} />
            </Stack>
          </div>
        </Stack>
      </form>
    </PageContainer>
  );
};

// Export default for lazy loading
export default ImportPage;
