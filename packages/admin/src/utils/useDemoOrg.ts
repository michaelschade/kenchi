import { gql, useQuery } from '@apollo/client';

import { DemoOrgUserQuery } from '../graphql/generated';

const DEMO_ORG_USER_QUERY = gql`
  query DemoOrgUserQuery {
    admin {
      organization(googleDomain: "kenchi.team") {
        updatedAt
        users(first: 100) {
          edges {
            node {
              id
              email
            }
          }
        }
      }
    }
  }
`;

export default function useDemoOrg() {
  return useQuery<DemoOrgUserQuery>(DEMO_ORG_USER_QUERY);
}
