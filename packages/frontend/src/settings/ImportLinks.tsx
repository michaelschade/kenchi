import { useCallback } from 'react';

import { gql, useMutation } from '@apollo/client';

import { isFailure } from '@kenchi/shared/lib/Result';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import { KenchiErrorFragment } from '../graphql/fragments';
import {
  DataImportTypeEnum,
  ImportLinkMutation,
  ImportLinkMutationVariables,
} from '../graphql/generated';
import { usePageDataController } from '../pageContext/pageData/usePageDataController';
import { usePreparedImport } from './usePreparedImport';

const MUTATION = gql`
  mutation ImportLinkMutation($type: DataImportTypeEnum!, $initialData: Json!) {
    createDataImport(type: $type, initialData: $initialData) {
      error {
        ...KenchiErrorFragment
      }
      dataImport {
        id
      }
    }
  }
  ${KenchiErrorFragment}
`;

export function ImportLinks() {
  const pageDataController = usePageDataController();
  const [, setPreparedImport] = usePreparedImport();

  const [mutate] = useMutation<ImportLinkMutation, ImportLinkMutationVariables>(
    MUTATION
  );

  const createImport = useCallback(
    async (
      actionType: 'extractIntercomData' | 'extractZendeskData',
      importType: DataImportTypeEnum
    ) => {
      setPreparedImport({
        state: 'pending',
        message: 'Extracting data…',
      });

      const extractDataResult = await pageDataController.runAction(actionType);

      if (isFailure(extractDataResult)) {
        setPreparedImport({
          state: 'error',
          message: extractDataResult.error.message,
        });
        return;
      }

      setPreparedImport({
        state: 'pending',
        message: 'Creating import with data extracted from Intercom…',
      });

      // TODO: handle error from await mutate?
      const res = await mutate({
        variables: {
          type: importType,
          initialData: extractDataResult.data,
        },
      });
      const dataImport = res.data?.createDataImport.dataImport;
      if (!dataImport) {
        setPreparedImport({
          state: 'error',
          message: 'Failed to create import with data extracted from Intercom',
        });
        return;
      }

      setPreparedImport({
        state: 'complete',
        url: `/dashboard/import/${dataImport.id}`,
      });
    },
    [setPreparedImport, pageDataController, mutate]
  );

  return (
    <>
      <UnstyledLink
        to="/dashboard/import/pending"
        target="_blank"
        onClick={() => {
          // kick off import in the background and let the dashboard's pending
          // page display the spinner
          createImport('extractIntercomData', DataImportTypeEnum.intercom);
        }}
      >
        Import from Intercom
      </UnstyledLink>
      <UnstyledLink
        to="/dashboard/import/pending"
        target="_blank"
        onClick={() => {
          // kick off import in the background and let the dashboard's pending
          // page display the spinner
          createImport('extractZendeskData', DataImportTypeEnum.zendesk);
        }}
      >
        Import from Zendesk
      </UnstyledLink>
    </>
  );
}
