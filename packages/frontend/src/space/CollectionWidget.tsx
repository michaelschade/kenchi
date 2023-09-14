import { gql, useApolloClient } from '@apollo/client';

import {
  CollectionListItemFragment,
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../graphql/fragments';
import { ListCollectionFragment } from '../graphql/generated';
import useTopItems from '../graphql/useTopItems';
import CollectionSection from './CollectionSection';
import {
  DEFAULT_USER_COLLECTION_CONFIG,
  UserCollectionSectionConfig,
  useSpaceSettings,
} from './useSpaceSettings';

// Keep in sync with useList
const LIST_COLLECTION_FRAGMENT = gql`
  fragment ListCollectionFragment on Collection {
    ...CollectionListItemFragment
    tools(first: 9999) @connection(key: "listTools") {
      edges {
        node {
          ...ToolListItemFragment
        }
      }
      removed
    }
    workflows(first: 9999) @connection(key: "listWorkflows") {
      edges {
        node {
          ...WorkflowListItemFragment
        }
      }
      removed
    }
  }
  ${ToolListItemFragment}
  ${WorkflowListItemFragment}
  ${CollectionListItemFragment}
`;

export default function CollectionWidget({
  collectionId,
  defaultConfig,
}: {
  collectionId: string;
  defaultConfig?: UserCollectionSectionConfig;
}) {
  const client = useApolloClient();
  const collection = client.cache.readFragment<ListCollectionFragment>({
    fragment: LIST_COLLECTION_FRAGMENT,
    fragmentName: 'ListCollectionFragment',
    id: client.cache.identify({ __typename: 'Collection', id: collectionId }),
  });

  const [settings, updateSettings] = useSpaceSettings();
  const { topMap } = useTopItems();

  if (!collection) {
    // TODO: error
    return null;
  }

  let userConfig;
  const potentialConfig = settings?.sections?.[collectionId];
  if (potentialConfig && potentialConfig.type !== 'special') {
    userConfig = potentialConfig;
  } else {
    userConfig = defaultConfig || DEFAULT_USER_COLLECTION_CONFIG;
  }

  return (
    <CollectionSection
      sectionConfig={{
        type: 'collection',
        key: collectionId,
        collection,
        userConfig,
      }}
      tools={collection.tools.edges}
      workflows={collection.workflows.edges}
      topMap={topMap}
      update={updateSettings}
    />
  );
}
