import { QueryHookOptions, useQuery } from '@apollo/client';
import gql from 'graphql-tag';

import { DomainSettingsQuery } from '../../graphql/generated';

export const QUERY = gql`
  query DomainSettingsQuery {
    viewer {
      defaultDomains(first: 1000) {
        edges {
          node {
            ...DomainFragment
          }
        }
      }
      organization {
        id
        shadowRecord
        domains(first: 1000) {
          edges {
            node {
              ...DomainFragment
            }
          }
        }
      }
      user {
        id
        domainSettings(first: 1000) {
          edges {
            node {
              id
              domain {
                id
                hosts
              }
              open
              side
            }
          }
        }
      }
    }
  }

  fragment DomainFragment on Domain {
    id
    name
    hosts
    defaultOpen
    defaultSide
    customPlacements
    variableExtractors
    insertionPath
  }
`;

export function useDomainSettingsQuery(options?: QueryHookOptions) {
  return useQuery<DomainSettingsQuery>(QUERY, options);
}
