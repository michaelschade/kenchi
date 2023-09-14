import { useEffect, useRef } from 'react';

import { gql, useQuery } from '@apollo/client';
import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import { Redirect, useParams } from 'react-router-dom';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import Loading from '@kenchi/ui/lib/Loading';

import ErrorAlert, { NotFoundAlert } from '../components/ErrorAlert';
import { isDemoUrl } from '../demo/utils';
import { SpaceFragment } from '../graphql/fragments';
import { SpacesQuery } from '../graphql/generated';
import useSettings from '../graphql/useSettings';
import useShortcuts from '../graphql/useShortcuts';
import {
  SelectableList,
  SelectableListActionConfig,
  SelectableListRef,
} from '../list/SelectableList';
import useList from '../list/useList';
import { SpaceNotifications } from '../notifications/SpaceNotifications';
import { usePageUrl } from '../pageContext/pageUrl/usePageUrl';
import { PreviewRef } from '../previewTile/PreviewTile';
import { SearchProvider, useSearch } from '../search/useSearch';
import Renderer from '../slate/Renderer';
import { TopBar } from '../topBar/TopBar';
import { forgivingLocalGet } from '../utils';
import { getSpaceUrl, magicSpaces } from '../utils/spaceUrl';
import SearchBox, { OFFSET_FOR_SCROLL } from './SearchBox';
import SearchResults, { SubsetType } from './SearchResults';
import { SpaceSettingsProvider } from './useSpaceSettings';

export const ACTION_KEYS: SelectableListActionConfig<PreviewRef>[] = [
  { key: 'Enter', action: 'exec' },
  { key: 'shift+Enter', action: 'open' },
  { key: 'e', action: 'edit' },
  { key: 'x', action: 'toggleCollapse' },
];

export const QUERY = gql`
  query SpacesQuery {
    viewer {
      organization {
        id
        defaultSpaceWidgets
      }
      user {
        id
        magicItemSettings(first: 1000) {
          edges {
            node {
              staticId
              data
            }
          }
        }
        spaces(first: 1000) {
          edges {
            node {
              ...SpaceFragment
              settings {
                staticId
                data
              }
            }
          }
        }
      }
    }
  }
  ${SpaceFragment}
`;

function ViewSpace() {
  const { id: urlId } = useParams<{ id?: string }>();

  const pageUrl = usePageUrl();
  const { searchInputValue } = useSearch();
  const selectableListRef = useRef<SelectableListRef>(null);

  const { data, loading, error } = useQuery<SpacesQuery>(QUERY, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  // Make sure our cache is up to date
  useShortcuts('network-only');

  const userSettings = useSettings();

  const { suggestSync } = useList();
  useEffect(() => {
    suggestSync();
    // Only run the first time we render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!urlId) {
    if (pageUrl && isDemoUrl(pageUrl)) {
      const spaceId = data?.viewer.user?.spaces.edges.find(
        (e) => e.node.name === 'Tier 2'
      )?.node.staticId;
      if (spaceId) {
        return <Redirect to={`/spaces/${spaceId}`} />;
      } else {
        return <Loading />;
      }
    } else {
      return <Redirect to={getSpaceUrl()} />;
    }
  }

  if (!data) {
    if (loading) {
      return <Loading name="view space page" />;
    } else if (error) {
      return <ErrorAlert title="Error loading space" error={error} />;
    } else {
      captureMessage('No data from default space query');
      return <NotFoundAlert title="Space not found" />;
    }
  }

  if (!data.viewer.user) {
    if (loading) {
      // If we cached a logged out user check the network before redirecting
      return <Loading />;
    } else {
      if (forgivingLocalGet('sentry-user')) {
        captureMessage('Previously logged in user no longer logged in', {
          extra: { ...data.viewer },
        });
      }
      return <Redirect to="/login" />;
    }
  }

  let widgets: SlateNode[];
  const spaces = data.viewer.user.spaces.edges.map((edge) => edge.node);
  let spaceSettings:
    | typeof data.viewer.user.magicItemSettings.edges[number]['node']
    | null;
  let collectionIds: undefined | string[];

  const spaceId =
    Object.entries(magicSpaces).find(
      ([_id, space]) => space.urlId === urlId
    )?.[0] || urlId;
  const currentSpaceId = spaceId || '__ALL__';

  if (spaceId.startsWith('__')) {
    switch (spaceId) {
      case '__ALL__':
        widgets = [
          { type: 'widget-drafts', children: [{ text: '' }] },
          { type: 'widget-top-used', children: [{ text: '' }] },
          ...(data.viewer.organization?.defaultSpaceWidgets || []),
          { type: 'widget-list', children: [{ text: '' }] },
        ];
        break;
      case '__PRIVATE__':
        widgets = [
          { type: 'widget-drafts', children: [{ text: '' }] },
          // This causes us to double-render the firstAutomation, which gives a
          // message handler error. Remove it for now. See:
          // https://sentry.io/organizations/kenchi/issues/2344507508/?project=3706884
          // { type: 'widget-top-used', children: [{ text: '' }] },
          { type: 'widget-list', privateOnly: true, children: [{ text: '' }] },
        ];
        break;
      default:
        return <NotFoundAlert title="Space not found" />;
    }
    spaceSettings =
      data.viewer.user.magicItemSettings.edges.find(
        (e) => e.node.staticId === spaceId
      )?.node || null;
    collectionIds = undefined;
  } else {
    const space = spaces.find((e) => e.staticId === spaceId);
    if (!space) {
      return <NotFoundAlert title="Space not found" />;
    }
    widgets = space.widgets;
    spaceSettings = space.settings;
    collectionIds = widgets
      .map((w) => (w.type === 'widget-collection' ? w.collectionId : null))
      .filter((w): w is string => !!w);
  }

  if (userSettings?.viewer.organization?.disabledMessage) {
    return (
      <Alert
        title="Kenchi is disabled for this organization"
        description={userSettings.viewer.organization.disabledMessage}
        primaryColor={BaseColors.error}
        icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
      />
    );
  }

  return (
    <ContentContainer>
      <TopBar currentSpaceId={currentSpaceId} spaces={spaces} />

      <SelectableList<PreviewRef>
        ref={selectableListRef}
        actionKeys={ACTION_KEYS}
        scrollable={true}
        scrollOffset={OFFSET_FOR_SCROLL}
      >
        <SpaceSettingsProvider
          data={spaceSettings?.data || null}
          staticId={currentSpaceId}
          collectionIds={collectionIds || null}
        >
          <SearchBox />

          {searchInputValue === '' ? (
            <>
              <SpaceNotifications />
              <Renderer contents={widgets} />
            </>
          ) : (
            <SearchResults
              collectionIds={collectionIds}
              subsetType={collectionIds ? SubsetType.space : undefined}
            />
          )}
        </SpaceSettingsProvider>
      </SelectableList>
    </ContentContainer>
  );
}

export default function ViewSpacePageWithSearch() {
  return (
    <SearchProvider>
      <ViewSpace />
    </SearchProvider>
  );
}
