import { useCallback, useState } from 'react';

import {
  ApolloError,
  ApolloQueryResult,
  gql,
  useMutation,
} from '@apollo/client';
import keyBy from 'lodash/keyBy';

import { KenchiErrorFragment } from '../graphql/fragments';
import {
  CreateExternalDataReferenceMutation,
  CreateExternalDataReferenceMutationVariables,
  ExternalDataReferencesQuery,
  ExternalReferenceTypeEnum,
  KenchiErrorFragment as KenchiErrorFragmentType,
  UpdateExternalDataReferenceMutation,
  UpdateExternalDataReferenceMutationVariables,
} from '../graphql/generated';

const CREATE_EXTERNAL_DATA_REFERENCE = gql`
  mutation CreateExternalDataReferenceMutation(
    $data: ExternalDataReferenceCreateInput!
  ) {
    modify: createExternalDataReference(data: $data) {
      error {
        ...KenchiErrorFragment
      }
      externalDataReference {
        id
        referenceType
        referenceSource
        referenceId
        label
      }
    }
  }

  ${KenchiErrorFragment}
`;
const UPDATE_EXTERNAL_DATA_REFERENCE = gql`
  mutation UpdateExternalDataReferenceMutation(
    $id: ID!
    $data: ExternalDataReferenceUpdateInput!
  ) {
    modify: updateExternalDataReference(id: $id, data: $data) {
      error {
        ...KenchiErrorFragment
      }
      externalDataReference {
        id
        referenceType
        referenceSource
        referenceId
        label
      }
    }
  }

  ${KenchiErrorFragment}
`;

type Tag = { id: string; label: string };

export type StatusOfSync = 'new' | 'syncing' | 'error' | 'complete';

export default function useSyncTags(
  referenceSource: 'intercom' | 'zendesk',
  refetchTags: () => Promise<ApolloQueryResult<ExternalDataReferencesQuery>>
) {
  const [createTag] = useMutation<
    CreateExternalDataReferenceMutation,
    CreateExternalDataReferenceMutationVariables
  >(CREATE_EXTERNAL_DATA_REFERENCE);
  const [updateTag] = useMutation<
    UpdateExternalDataReferenceMutation,
    UpdateExternalDataReferenceMutationVariables
  >(UPDATE_EXTERNAL_DATA_REFERENCE);

  const [statusOfSync, setStatusOfSync] = useState<StatusOfSync>('new');
  const [errorFromSync, setErrorFromSync] = useState<
    ApolloError | KenchiErrorFragmentType | null
  >(null);
  const [summaryOfSync, setSummaryOfSync] = useState<{
    total: number;
    created: number;
    updated: number;
  } | null>(null);

  const syncTags = useCallback(
    async (existingTags: Tag[], updatedTags: Tag[]) => {
      if (statusOfSync === 'syncing') {
        return;
      }

      setErrorFromSync(null);
      setStatusOfSync('syncing');
      const existingTagsByReferenceId = keyBy(existingTags, 'referenceId');

      const tagsToCreate = updatedTags.filter(
        (tag) => !(tag.id in existingTagsByReferenceId)
      );
      const tagsToUpdate = updatedTags.filter(
        (tag) =>
          existingTagsByReferenceId[tag.id] &&
          existingTagsByReferenceId[tag.id].label !== tag.label
      );

      const createPromises = tagsToCreate.map((tag) =>
        createTag({
          variables: {
            data: {
              referenceType: ExternalReferenceTypeEnum.tag,
              referenceSource,
              referenceId: tag.id,
              label: tag.label,
            },
          },
        })
      );
      const updatePromises = tagsToUpdate.map((tag) =>
        updateTag({
          variables: {
            id: existingTagsByReferenceId[tag.id].id,
            data: { referenceId: tag.id, label: tag.label },
          },
        })
      );

      // TODO: this doesn't handle ApolloErrors
      const results = await Promise.all(createPromises.concat(updatePromises));

      const firstError = results
        .map((r) => r.data?.modify.error)
        .find((err) => !!err);
      if (firstError) {
        setStatusOfSync('error');
        setErrorFromSync(firstError);
      } else {
        await refetchTags();
        setSummaryOfSync({
          total: updatedTags.length,
          created: tagsToCreate.length,
          updated: tagsToUpdate.length,
        });
        setStatusOfSync('complete');
      }
    },
    [createTag, referenceSource, refetchTags, statusOfSync, updateTag]
  );
  return { syncTags, statusOfSync, summaryOfSync, errorFromSync };
}
