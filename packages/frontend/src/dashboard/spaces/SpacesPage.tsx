import { gql, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
import sortBy from 'lodash/sortBy';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LinkWithIcon } from '@kenchi/ui/lib/Dashboard/LinkWithIcon';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { RawTable, TableRowLink } from '@kenchi/ui/lib/Dashboard/Table';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import ErrorAlert from '../../components/ErrorAlert';
import { SpacesPageQuery } from '../../graphql/generated';
import { useHasOrgPermission } from '../../graphql/useSettings';
import { pluralize } from '../../utils';
import { sharedWith } from '../sharedWith';

const QUERY = gql`
  query SpacesPageQuery {
    viewer {
      user {
        id
        spaces(first: 1000) {
          edges {
            node {
              id
              staticId
              branchId
              name
              widgets
              acl {
                userGroup {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const Spaces = () => {
  const { data, loading, error } = useQuery<SpacesPageQuery>(QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  if (!data) {
    if (loading) {
      return <LoadingSpinner name="dashboard spaces" />;
    }
    if (error) {
      return <ErrorAlert title="Error loading spaces" error={error} />;
    }
    throw new Error('Error loading spaces');
  }

  const spaces = sortBy(
    data.viewer.user?.spaces.edges.map((e) => e.node) || [],
    (g) => g.name
  );

  return (
    <ContentCard fullBleed>
      {spaces.length ? (
        <RawTable>
          <thead>
            <tr>
              <th>Space</th>
              <th>Collections</th>
              <th>Sharing</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {spaces.map((space) => (
              <TableRowLink
                key={space.staticId}
                css={tw`text-sm`}
                to={`/dashboard/spaces/${space.staticId}`}
              >
                <td>{space.name}</td>
                <td>{pluralize(space.widgets.length, 'collection')}</td>
                <td>Shared with {sharedWith(space.acl) || 'everyone'}</td>
              </TableRowLink>
            ))}
          </tbody>
        </RawTable>
      ) : (
        <div
          css={({ colors }: KenchiTheme) =>
            css`
              ${tw`p-8 text-center`}
              color: ${colors.gray[12]}
            `
          }
        >
          No spaces.{' '}
          <UnstyledLink to="/dashboard/spaces/new">Create one?</UnstyledLink>
        </div>
      )}
    </ContentCard>
  );
};

const SpacesPage = () => {
  const canCreate = useHasOrgPermission('manage_spaces');

  return (
    <PageContainer
      meta={{ title: 'Spaces' }}
      heading="Spaces"
      subheading={
        <>Use spaces to customize what users see on the Kenchi app home page</>
      }
      actions={
        canCreate ? (
          <LinkWithIcon to="/dashboard/spaces/new" icon={faPlusCircle}>
            New space
          </LinkWithIcon>
        ) : null
      }
    >
      <Spaces />
    </PageContainer>
  );
};

export default SpacesPage;
