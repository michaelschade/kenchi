import { ApolloError, gql, useQuery } from '@apollo/client';

import { DataSourcesQuery } from '../../graphql/generated';

const DATA_SOURCES_QUERY = gql`
  query DataSourcesQuery {
    viewer {
      organization {
        id
        dataSources {
          id
          requests
        }
      }
    }
  }
`;

export const useDataSources = (): {
  loading: boolean;
  error: ApolloError | undefined;
  dataSources: { id: string; requests: any[] }[] | null;
} => {
  const { data, loading, error } = useQuery<DataSourcesQuery>(
    DATA_SOURCES_QUERY,
    {
      fetchPolicy: 'cache-and-network',
    }
  );
  const dataSources = data?.viewer?.organization?.dataSources || null;
  return { dataSources, loading, error };
};
