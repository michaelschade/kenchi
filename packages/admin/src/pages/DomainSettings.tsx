import { gql, QueryResult, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import sortBy from 'lodash/sortBy';
import { useParams } from 'react-router-dom';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable } from '@kenchi/ui/lib/Dashboard/Table';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import {
  DomainFragment,
  GlobalDomainSettingsQuery,
  OrgDomainSettingsQuery,
  OrgDomainSettingsQueryVariables,
  UserDomainSettingsQuery,
  UserDomainSettingsQueryVariables,
} from '../graphql/generated';

const tableStyle = css`
  table-layout: fixed;
`;

const DOMAIN_FRAGMENT = gql`
  fragment DomainFragment on Domain {
    id
    name
    hosts
    isGmail
    variableExtractors
    insertTextXPath
    inject
    injectSidebar
    injectHud
    defaultOpen
    defaultSide
    customPlacements
  }
`;

const ORG_QUERY = gql`
  query OrgDomainSettingsQuery($orgId: ID!) {
    admin {
      organization(id: $orgId) {
        id
        name
        googleDomain
        domains(first: 9999) {
          edges {
            node {
              ...DomainFragment
            }
          }
        }
      }
    }
  }
  ${DOMAIN_FRAGMENT}
`;

const GLOBAL_QUERY = gql`
  query GlobalDomainSettingsQuery {
    admin {
      nonOrgDomains(first: 9999) {
        edges {
          node {
            ...DomainFragment
          }
        }
      }
    }
  }
  ${DOMAIN_FRAGMENT}
`;

const USER_QUERY = gql`
  query UserDomainSettingsQuery($userId: ID!) {
    admin {
      user(id: $userId) {
        id
        name
        email
        organization {
          id
        }
        domainSettings(first: 9999) {
          edges {
            node {
              id
              open
              side
              injectHud
              domain {
                id
                name
                hosts
              }
            }
          }
        }
      }
    }
  }
`;

function getLoadStateString(domain: {
  defaultOpen: boolean | null;
  injectSidebar: boolean | null;
  injectHud: boolean | null;
  inject: boolean | null;
}) {
  const loadState: string[] = [];
  if (domain.defaultOpen) {
    loadState.push('open sidebar');
  } else if (domain.injectSidebar) {
    loadState.push('preload sidebar');
  }

  if (domain.injectHud) {
    loadState.push('inject HUD');
  }

  if (loadState.length === 0 && domain.inject) {
    loadState.push('preload contentScript');
  }

  const rtn = loadState.join(' and ');
  return `${(rtn[0] || '').toUpperCase()}${rtn.substring(1)}`;
}

function DomainSettingsRow({ domain }: { domain: DomainFragment }) {
  const placement: string[] = [];
  if (domain.defaultSide) {
    placement.push(`Default: ${domain.defaultSide}`);
  }
  const customSides = Object.keys(domain.customPlacements || {});
  if (customSides.length > 0) {
    placement.push(`Options: ${customSides.join(', ')}`);
  }
  return (
    <tr>
      <td>
        {domain.hosts.length === 0 ? (
          <em>GLOBAL DEFAULT</em>
        ) : (
          domain.hosts.join(', ')
        )}
        {domain.name && ` (${domain.name})`}
      </td>
      <td>{getLoadStateString(domain)}</td>
      <td>{placement.join('. ')}</td>
    </tr>
  );
}

function GlobalDomainSettings() {
  const { data, loading, error } =
    useQuery<GlobalDomainSettingsQuery>(GLOBAL_QUERY);

  if (!data) {
    if (loading) {
      return <LoadingSpinner />;
    } else if (error) {
      return <>Error: {error.message}</>;
    }
  }

  const domains = sortBy(
    data?.admin?.nonOrgDomains?.edges?.map(({ node }) => node),
    (node) => node.hosts[0] || '**'
  );

  return (
    <ContentCard title="Global" fullBleed>
      <RawTable
        css={tableStyle}
        columnHeadings={['Hosts', 'On Load', 'Sidebar Placement']}
      >
        <tbody>
          {domains.map((domain) => (
            <DomainSettingsRow key={domain.id} domain={domain} />
          ))}
        </tbody>
      </RawTable>
    </ContentCard>
  );
}

function OrgDomainSettings({ orgId }: { orgId: string }) {
  const { data, loading, error } = useQuery<
    OrgDomainSettingsQuery,
    OrgDomainSettingsQueryVariables
  >(ORG_QUERY, { variables: { orgId } });

  if (!data) {
    if (loading) {
      return <LoadingSpinner />;
    } else if (error) {
      return <>Error: {error.message}</>;
    }
  }

  const org = data?.admin?.organization;

  const domains = sortBy(
    org?.domains?.edges?.map(({ node }) => node),
    (node) => node.hosts[0] || '**'
  );

  const orgName = org?.name || org?.googleDomain || 'organization';
  return (
    <ContentCard title={`Shared across ${orgName}`} fullBleed>
      <RawTable
        css={tableStyle}
        columnHeadings={['Hosts', 'On Load', 'Sidebar Placement']}
      >
        <tbody>
          {domains.map((domain) => (
            <DomainSettingsRow key={domain.id} domain={domain} />
          ))}
        </tbody>
      </RawTable>
    </ContentCard>
  );
}

function UserDomainSettings({
  queryResults,
}: {
  queryResults: QueryResult<
    UserDomainSettingsQuery,
    UserDomainSettingsQueryVariables
  >;
}) {
  const { data, loading, error } = queryResults;
  if (!data) {
    if (loading) {
      return <LoadingSpinner />;
    } else if (error) {
      return <>Error: {error.message}</>;
    }
  }

  const user = data?.admin?.user;
  return (
    <ContentCard
      title={user?.email ? `Specific to ${user.email}` : 'User-specific'}
      fullBleed
    >
      <RawTable
        css={tableStyle}
        columnHeadings={['Hosts', 'On Load', 'Sidebar Placement']}
      >
        <tbody>
          {user?.domainSettings.edges.map(({ node }) => (
            <tr key={node.id}>
              <td>{node.domain.hosts.join(', ')}</td>
              <td>
                {getLoadStateString({
                  defaultOpen: node.open,
                  inject: null,
                  injectHud: node.injectHud,
                  injectSidebar: null,
                })}
              </td>
              <td>{node.side}</td>
            </tr>
          ))}
        </tbody>
      </RawTable>
    </ContentCard>
  );
}

export default function DomainSettings() {
  const { orgId: pathOrgId, userId } = useParams<{
    orgId?: string;
    userId?: string;
  }>();

  const queryResults = useQuery<
    UserDomainSettingsQuery,
    UserDomainSettingsQueryVariables
  >(USER_QUERY, { skip: !userId, variables: { userId: userId || '' } });

  const orgId = pathOrgId || queryResults.data?.admin?.user?.organization?.id;

  return (
    <PageContainer heading="Domain settings" width="xl">
      {userId && <UserDomainSettings queryResults={queryResults} />}
      {orgId && <OrgDomainSettings orgId={orgId} />}
      <GlobalDomainSettings />
    </PageContainer>
  );
}
