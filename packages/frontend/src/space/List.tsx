import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import fromPairs from 'lodash/fromPairs';
import keyBy from 'lodash/keyBy';
import { useHistory } from 'react-router-dom';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Link } from '@kenchi/ui/lib/Text';
import useHotkey from '@kenchi/ui/lib/useHotkey';

import ErrorAlert from '../components/ErrorAlert';
import useTopItems from '../graphql/useTopItems';
import useList from '../list/useList';
import { trackEvent } from '../utils/analytics';
import CollectionSection from './CollectionSection';
import {
  FullSectionConfig,
  useListSections,
  UserBaseSectionConfig,
  useSpaceSettings,
} from './useSpaceSettings';
import { applyToSection, sectionCollapsed } from './utils';

function scoreBaseSection(baseConfig: UserBaseSectionConfig) {
  if (baseConfig.hidden) {
    return 0;
  }
  if (baseConfig.collapsed) {
    return 1;
  }
  if (baseConfig.limit) {
    return Math.min(baseConfig.limit, 5);
  }
  return 5;
}

// Heuristic to decide how many sections to pre-render
function scoreSection(sectionConfig: FullSectionConfig) {
  if (sectionConfig.type === 'collection') {
    return (
      scoreBaseSection(sectionConfig.userConfig.workflows || {}) +
      scoreBaseSection(sectionConfig.userConfig.tools || {})
    );
  } else {
    return scoreBaseSection(sectionConfig.userConfig);
  }
}

// Tracks scrolls, resizes, and config changes to decide how many sections to
// load. Basically home-grown infinite scroll.
function useLazyLoadSections(allSections: FullSectionConfig[]) {
  const [loadedSectionCount, setLoadedSectionCount] = useState(5);

  const maybeLoadMore = useCallback(() => {
    const bottomVisible = window.scrollY + window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;
    // If we're more than halfway down expand our list
    if (
      (window.scrollY > 0 && bottomVisible > scrollHeight / 2) ||
      window.innerHeight >= scrollHeight
    ) {
      setLoadedSectionCount((count) => Math.min(count + 5, allSections.length));
    }
  }, [allSections.length]);

  useEffect(() => {
    window.addEventListener('scroll', maybeLoadMore);
    window.addEventListener('resize', maybeLoadMore);
    return () => {
      window.removeEventListener('scroll', maybeLoadMore);
      window.removeEventListener('resize', maybeLoadMore);
    };
  }, [maybeLoadMore]);

  useEffect(() => {
    // Estimate the number of rows in a section to make sure we're rendering at
    // least ~50 total rows (vs. the default 5 sections which could all be
    // collapsed).
    let runningScore = 0;
    for (var i = 0; i < allSections.length; i++) {
      runningScore += scoreSection(allSections[i]);
      if (runningScore > 50) {
        break;
      }
    }
    setLoadedSectionCount((count) =>
      Math.min(Math.max(count, i), allSections.length)
    );
  }, [allSections]);

  useLayoutEffect(() => {
    // This 500ms delay is lame, but this runs before all the inner stuff
    // finishes rendering, so without it we'd bump our loadedSectionCount
    // prematurely
    window.setTimeout(() => maybeLoadMore(), 500);
  }, [maybeLoadMore, allSections]);

  return loadedSectionCount;
}

export default function List({ privateOnly }: { privateOnly?: boolean }) {
  const history = useHistory();

  const { topMap } = useTopItems({ fetchPolicy: 'cache-and-network' });

  // TODO: refactor so we don't need useSpaceSettings, useListSections, and useUpdateSpaceSettings all together...
  const [_settings, updateSettings] = useSpaceSettings();

  // This is causing the "unmounted component" warning you're seeing.
  // See https://github.com/apollographql/apollo-client/issues/6209
  const {
    collections: collectionEdges,
    error,
    loading,
    suggestSync,
  } = useList();

  useEffect(() => {
    suggestSync();
    // Only run the first time we render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collectionNodes = collectionEdges?.edges
    .map((e) => e.node)
    .filter((n) => !privateOnly || n.isPrivate);

  const collectionsById = keyBy(collectionNodes || [], 'id');
  const allSections = useListSections(collectionsById);

  const loadedSectionCount = useLazyLoadSections(allSections);

  // TODO: move to ViewSpace level so it applies to all sections, not just the list.
  const [toggleMap, setToggleMap] = useState<Record<
    string,
    boolean | undefined
  > | null>(null);
  useHotkey(
    'shift+x',
    useCallback(() => {
      const allClosed = allSections.every(sectionCollapsed);
      const allOpen = allSections.every((c) => !sectionCollapsed(c));
      // First collapse everything, then expand everything, then return to previous
      if (allOpen) {
        if (toggleMap) {
          allSections.forEach((c) =>
            updateSettings(applyToSection(c, { collapsed: toggleMap[c.key] }))
          );
          setToggleMap(null);
          trackEvent({
            category: 'page_settings',
            action: 'toggle_collapse_all',
            source: 'from_all_open_to_mixed',
          });
        } else {
          allSections.forEach((c) =>
            updateSettings(applyToSection(c, { collapsed: true }))
          );
          trackEvent({
            category: 'page_settings',
            action: 'toggle_collapse_all',
            source: 'from_all_open_to_closed',
          });
        }
      } else if (allClosed) {
        allSections.forEach((c) =>
          updateSettings(applyToSection(c, { collapsed: false }))
        );
        trackEvent({
          category: 'page_settings',
          action: 'toggle_collapse_all',
          source: 'from_all_closed',
        });
      } else {
        setToggleMap(
          fromPairs(allSections.map((c) => [c.key, sectionCollapsed(c)]))
        );
        allSections.forEach((c) =>
          updateSettings(applyToSection(c, { collapsed: true }))
        );
        trackEvent({
          category: 'page_settings',
          action: 'toggle_collapse_all',
          source: 'from_mixed_state',
        });
      }
    }, [allSections, updateSettings, toggleMap])
  );

  if (
    !collectionNodes ||
    collectionNodes.every(
      (n) => n.tools.edges.length + n.workflows.edges.length === 0
    )
  ) {
    if (error) {
      return <ErrorAlert title="Error loading list" error={error} />;
    } else if (loading) {
      return (
        <div style={{ textAlign: 'center' }}>
          <h4>
            <LoadingSpinner />
          </h4>
          <h4>Preparing Kenchi</h4>
          <p className="text-muted">
            This one-time load can take up
            <br />
            to 10 seconds
          </p>
        </div>
      );
    } else {
      return (
        <p key="hint" className="text-muted">
          You don't have any snippets or playbooks yet. Don't worry,{' '}
          <Link onClick={() => history.push('/new')}>
            it's easy to fix that
          </Link>
          !
        </p>
      );
    }
  }

  return (
    <>
      {allSections.slice(0, loadedSectionCount).map((sectionConfig) => {
        const collection = collectionsById[sectionConfig.collection.id];

        return (
          <CollectionSection
            key={sectionConfig.key}
            sectionConfig={sectionConfig}
            workflows={collection.workflows.edges}
            tools={collection.tools.edges}
            topMap={topMap}
            update={updateSettings}
          />
        );
      })}
    </>
  );
}
