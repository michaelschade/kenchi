import { useMemo, useRef, useState } from 'react';

import { gql, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { faArrowLeft, faPencilAlt } from '@fortawesome/pro-solid-svg-icons';
import { captureMessage } from '@sentry/react';
import sortBy from 'lodash/sortBy';
import { useHistory, useParams } from 'react-router-dom';

import Emoji from '@kenchi/ui/lib/Emoji';
import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import Loading from '@kenchi/ui/lib/Loading';
import useHotkey from '@kenchi/ui/lib/useHotkey';

import ErrorAlert, { NotFoundAlert } from '../components/ErrorAlert';
import InfoCardPopover from '../components/InfoCardPopover';
import {
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../graphql/fragments';
import {
  ViewCollectionQuery,
  ViewCollectionQueryVariables,
} from '../graphql/generated';
import {
  useHasCollectionPermission,
  useHasOrgPermission,
} from '../graphql/useSettings';
import ListItem from '../list/ListItem';
import { SelectableList, SelectableListRef } from '../list/SelectableList';
import { PreviewRef } from '../previewTile/PreviewTile';
import { SearchProvider, useSearch } from '../search/useSearch';
import SearchBox, { OFFSET_FOR_SCROLL } from '../space/SearchBox';
import SearchResults, { SubsetType } from '../space/SearchResults';
import { ACTION_KEYS } from '../space/ViewSpacePage';
import EditCollectionModal from './EditCollectionModal';

const QUERY = gql`
  query ViewCollectionQuery($id: ID!) {
    node(id: $id) {
      id
      ... on LimitedCollection {
        name
        icon
        description
      }
      ... on Collection {
        name
        icon
        description
        organization {
          id
        }
        workflows(first: 1000) {
          edges {
            node {
              embeddedInWorkflows(first: 1) {
                edges {
                  node {
                    staticId
                    branchId
                  }
                }
              }
              ...WorkflowListItemFragment
            }
          }
        }
        tools(first: 1000) {
          edges {
            node {
              ...ToolListItemFragment
            }
          }
        }
        relatedTools(first: 1000) {
          edges {
            node {
              ...ToolListItemFragment
            }
          }
        }
        topUsedTools(first: 5) {
          edges {
            node {
              ...ToolListItemFragment
            }
          }
        }
      }
    }
  }
  ${WorkflowListItemFragment}
  ${ToolListItemFragment}
`;

const containerStyle = css`
  h2 {
    margin-bottom: 10px;
  }
`;

type CollectionNode = Extract<
  ViewCollectionQuery['node'],
  { __typename: 'Collection' }
>;

function Collection({ collection }: { collection: CollectionNode }) {
  const getNode = <T extends any>(e: { node: T }) => e.node;
  //const sort = (item: ToolListItemFragment | WorkflowListItemFragment) => item.name.toLowerCase();
  const workflows = sortBy(collection.workflows.edges.map(getNode), (w) =>
    w.name.toLowerCase()
  );
  const embeds = sortBy(
    workflows.filter((w) => w.embeddedInWorkflows.edges.length > 0),
    (e) => e.name.toLowerCase()
  );
  const tools = sortBy(collection.tools.edges.map(getNode), (t) =>
    t.name.toLowerCase()
  );
  const relatedTools = sortBy(collection.relatedTools.edges.map(getNode), (t) =>
    t.name.toLowerCase()
  );

  let topUsed: CollectionNode['topUsedTools']['edges'][number]['node'][] = [];
  if (tools.length + relatedTools.length > 5) {
    topUsed = collection.topUsedTools.edges.map((w) => w.node);
  }

  return (
    <div css={containerStyle}>
      {topUsed.length > 0 && (
        <>
          <SectionHeader>
            <span
              style={{ fontSize: '0.9em' }}
              role="img"
              aria-label="Favorite Icon"
            >
              🌟
            </span>{' '}
            Your Top Snippets
          </SectionHeader>
          {topUsed.map((tool) => (
            <ListItem
              key={tool.id}
              item={tool}
              analyticsSource="collection-top-used"
            />
          ))}
        </>
      )}

      {workflows.length > 0 && (
        <>
          <SectionHeader>Playbooks</SectionHeader>
          {workflows.map((w) => (
            <ListItem key={w.id} item={w} analyticsSource="collection" />
          ))}
        </>
      )}

      {tools.length > 0 && (
        <>
          <SectionHeader>Snippets</SectionHeader>
          {tools.map((t) => (
            <ListItem key={t.id} item={t} analyticsSource="collection" />
          ))}
        </>
      )}

      {relatedTools.length > 0 && (
        <>
          <SectionHeader>
            Related Snippets
            <HelpIcon
              placement="top"
              content="Snippets not explicitly added to this Collection, but related to it; for example, those used in Playbooks listed above."
            />
          </SectionHeader>
          {relatedTools.map((t) => (
            <ListItem key={t.id} item={t} analyticsSource="collection" />
          ))}
        </>
      )}

      {embeds.length > 0 && (
        <>
          <SectionHeader>Embeds</SectionHeader>
          {embeds.map((w) => (
            <ListItem key={w.id} item={w} analyticsSource="collection" />
          ))}
        </>
      )}
    </div>
  );
}

type HeaderProps = {
  collection: {
    __typename: 'Collection' | 'LimitedCollection';
    name: string;
    icon: string | null;
    description: string;
  };
  onEdit?: () => void;
  canEdit?: boolean;
};
const CollectionHeader = ({ collection, onEdit, canEdit }: HeaderProps) => {
  const history = useHistory();
  const [infoCardIsOpen, setInfoCardIsOpen] = useState(false);
  useHotkey('i', () => setInfoCardIsOpen(!infoCardIsOpen));
  return (
    <HeaderBar>
      <HeaderIconLink onClick={() => history.goBack()} icon={faArrowLeft} />

      {collection.icon && (
        <h2>
          <Emoji emoji={collection.icon} />
        </h2>
      )}
      <SectionHeader>{collection.name}</SectionHeader>

      {canEdit && (
        <HeaderIconLink
          icon={faPencilAlt}
          onClick={() => onEdit?.()}
          title="Edit collection"
        />
      )}
      {collection.description && (
        <InfoCardPopover
          item={collection}
          isOpen={infoCardIsOpen}
          onOpenChange={setInfoCardIsOpen}
        />
      )}
    </HeaderBar>
  );
};

function ViewCollectionPage() {
  const { id } = useParams<{ id: string }>();
  const [showEditModal, setShowEditModal] = useState(false);
  const { searchInputValue } = useSearch();
  const selectableListRef = useRef<SelectableListRef>(null);

  const { loading, error, data } = useQuery<
    ViewCollectionQuery,
    ViewCollectionQueryVariables
  >(QUERY, { variables: { id }, fetchPolicy: 'cache-and-network' });

  const collection = data?.node?.__typename === 'Collection' ? data.node : null;

  const canEditLocal = useHasCollectionPermission(
    id,
    'manage_collection_permissions'
  );
  const canEditGlobal =
    useHasOrgPermission('manage_collections') && !!collection?.organization;

  const idArr = useMemo(() => [id], [id]);

  if (!collection) {
    if (loading) {
      return <Loading name="view collection" />;
    } else if (error) {
      return <ErrorAlert title="Error loading collection" error={error} />;
    } else {
      if (data?.node?.__typename === 'LimitedCollection') {
        return (
          <>
            <CollectionHeader collection={data.node} />

            <ContentContainer>
              <ErrorAlert
                title="You do not have permission to view this collection."
                error={true}
              />
            </ContentContainer>
          </>
        );
      } else {
        captureMessage('Collection not found');
        return <NotFoundAlert title="Collection not found" />;
      }
    }
  }

  return (
    <>
      <EditCollectionModal
        isOpen={showEditModal}
        id={collection.id}
        onBack={() => setShowEditModal(false)}
        onUpdate={() => setShowEditModal(false)}
      />

      <CollectionHeader
        collection={collection}
        canEdit={!!(canEditLocal || canEditGlobal)}
        onEdit={() => setShowEditModal(true)}
      />

      <ContentContainer>
        <SelectableList<PreviewRef>
          ref={selectableListRef}
          actionKeys={ACTION_KEYS}
          scrollable={true}
          scrollOffset={OFFSET_FOR_SCROLL}
        >
          <SearchBox />
          {searchInputValue === '' ? (
            <Collection collection={collection} />
          ) : (
            <SearchResults
              collectionIds={idArr}
              subsetType={SubsetType.collection}
            />
          )}
        </SelectableList>
      </ContentContainer>
    </>
  );
}

export default function ViewCollectionPageWithSearch() {
  return (
    <SearchProvider>
      <ViewCollectionPage />
    </SearchProvider>
  );
}
