import { gql, useQuery } from '@apollo/client';
import { faFileInvoice, faLayerGroup } from '@fortawesome/pro-solid-svg-icons';

import {
  MenuItem,
  MenuItemLink,
  MenuSection,
} from '@kenchi/ui/lib/DropdownMenu';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import ErrorAlert from '../components/ErrorAlert';
import {
  ToolRelatedContentQuery,
  ToolRelatedContentQueryVariables,
} from '../graphql/generated';
import { pluralize } from '../utils';
import { isTool } from '../utils/versionedNode';

const RELATED_QUERY = gql`
  query ToolRelatedContentQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      staticId
      branchId
      ... on ToolLatest {
        workflows(first: 1000) {
          edges {
            node {
              id
              staticId
              branchId
              name
            }
          }
        }
        collections(first: 1000) {
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

type Props = {
  staticId: string;
};

export const ToolMenuRelatedContent = ({ staticId }: Props) => {
  const { loading, error, data } = useQuery<
    ToolRelatedContentQuery,
    ToolRelatedContentQueryVariables
  >(RELATED_QUERY, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    variables: { staticId },
  });

  if (error) {
    return (
      <MenuSection title="Related content">
        <ErrorAlert title="Couldn't load related content" error={error} />
      </MenuSection>
    );
  }

  if (loading && !data) {
    return (
      <MenuSection title="Related content">
        <MenuItem>
          <LoadingSpinner name="tool menu related content" />
        </MenuItem>
      </MenuSection>
    );
  }

  const tool = data?.versionedNode;
  if (!tool || !isTool(tool)) {
    return null;
  }

  const workflows = tool.workflows.edges.map((d) => d.node);
  const collections = tool.collections.edges.map((d) => d.node);

  return (
    <>
      {workflows.length ? (
        <MenuSection
          title={`Used in ${pluralize(workflows.length, 'playbook')}`}
          icon={faFileInvoice}
        >
          {workflows.map((workflow) => (
            <MenuItemLink
              key={workflow.id}
              to={`/playbooks/${workflow.staticId}`}
              truncate
            >
              {workflow.name}
            </MenuItemLink>
          ))}
        </MenuSection>
      ) : null}

      {collections.length ? (
        <MenuSection
          title={`Included in ${pluralize(collections.length, 'collection')}`}
          icon={faLayerGroup}
        >
          {collections.map((collection) => (
            <MenuItemLink
              key={collection.id}
              to={`/collections/${collection.id}`}
              truncate
            >
              {collection.name}
            </MenuItemLink>
          ))}
        </MenuSection>
      ) : null}
    </>
  );
};
