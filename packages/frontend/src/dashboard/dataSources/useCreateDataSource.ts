import { useCallback } from 'react';

import { gql, useMutation } from '@apollo/client';

import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
  DataSourceCreateInput,
} from '../../graphql/generated';
import { DataSource } from './types';

const CREATE_DATA_SOURCE = gql`
  mutation CreateDataSourceMutation(
    $dataSourceCreateInput: DataSourceCreateInput!
  ) {
    modify: createDataSource(data: $dataSourceCreateInput) {
      error {
        ...KenchiErrorFragment
      }
      dataSource {
        id
        name
        requests
        outputs
      }
    }
  }
  ${KenchiErrorFragment}
`;

export const useCreateDataSource = (
  onCreate: (dataSource: DataSource) => void
) => {
  const [createDataSource, dataSourceCreationResult] = useMutation<
    CreateDataSourceMutation,
    CreateDataSourceMutationVariables
  >(CREATE_DATA_SOURCE);

  const create = useCallback(
    async (dataSourceCreateInput: DataSourceCreateInput) => {
      const res = await createDataSource({
        variables: { dataSourceCreateInput },
      });
      const dataSource = res.data?.modify.dataSource;
      if (dataSource) {
        onCreate(dataSource);
      }
    },
    [createDataSource, onCreate]
  );

  return {
    create,
    dataSourceCreationResult,
  };
};
