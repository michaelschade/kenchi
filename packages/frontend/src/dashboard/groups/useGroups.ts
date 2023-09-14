import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';

import { GroupsQuery } from '../../graphql/generated';

const GROUPS_QUERY = gql`
  query GroupsQuery {
    viewer {
      organization {
        id
        userGroups(first: 1000) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  }
`;

const useGroups = () => {
  const { data, loading, error } = useQuery<GroupsQuery>(GROUPS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const groups = useMemo(() => {
    return (
      data?.viewer?.organization?.userGroups.edges.map((edge) => edge.node) ||
      []
    );
  }, [data]);

  return { groups, loading, error, refetchQueries: [{ query: GROUPS_QUERY }] };
};

export default useGroups;
