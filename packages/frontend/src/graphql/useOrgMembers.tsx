import { useMemo } from 'react';

import { gql, useQuery } from '@apollo/client';

import { OrgMembersQuery } from './generated';
import { hasVisibleOrg } from './utils';

type Org = NonNullable<OrgMembersQuery['viewer']['organization']>;
export type OrgMembersUser = Org['users']['edges'][number]['node'];
export type OrgMembersGroup = Org['userGroups']['edges'][number]['node'];

export const ORG_MEMBERS_QUERY = gql`
  query OrgMembersQuery {
    viewer {
      organization {
        id
        shadowRecord
        users(first: 1000) {
          edges {
            node {
              id
              email
              name
            }
          }
        }
        userGroups(first: 1000) {
          edges {
            node {
              id
              name
              members(first: 1000) {
                edges {
                  node {
                    id
                  }
                  isManager
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default function useOrgMembers() {
  const queryResult = useQuery<OrgMembersQuery>(ORG_MEMBERS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  return useMemo(
    () => ({
      ...queryResult,
      data: hasVisibleOrg(queryResult.data?.viewer)
        ? queryResult.data?.viewer.organization
        : null,
    }),
    [queryResult]
  );
}
