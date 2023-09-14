import { QueryHookOptions, useQuery } from '@apollo/client';
import gql from 'graphql-tag';

import {
  ExternalDataReferencesQuery,
  ExternalReferenceTypeEnum,
} from '../graphql/generated';

export const QUERY = gql`
  query ExternalDataReferencesQuery(
    $referenceType: ExternalReferenceTypeEnum!
    $referenceSource: String!
  ) {
    viewer {
      organization {
        id
        shadowRecord
        externalDataReferences(
          referenceType: $referenceType
          referenceSource: $referenceSource
        ) {
          id
          referenceType
          referenceSource
          label
          referenceId
        }
      }
    }
  }
`;

export default function useExternalDataReferences(
  filters: {
    referenceType: ExternalReferenceTypeEnum;
    referenceSource: string;
  },
  queryOptions?: QueryHookOptions
) {
  return useQuery<ExternalDataReferencesQuery>(QUERY, {
    ...queryOptions,
    variables: filters,
  });
}
