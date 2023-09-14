import { useCallback, useContext, useMemo, useState } from 'react';

import { captureMessage } from '@sentry/react';
import sortBy from 'lodash/sortBy';

import useShortcuts from '../graphql/useShortcuts';
import useFuse, { FuseResult } from '../list/useFuse';
import useList, {
  ListItemType,
  useFlatListWithCollections,
} from '../list/useList';
import {
  CLIENT_SIDE_SEARCH_WEIGHT_FOR_COLLECTION_RESULTS,
  DEFAULT_HITS_PER_PAGE,
} from './constants';
import { SearchFilters, translateFiltersToFunction } from './filter';
import { ListItemOrCollection, SearchContext } from './useSearch';

export const weightedClientSideSearchScore = ({
  item,
  score,
}: FuseResult<ListItemOrCollection>): number => {
  if (item.__typename === 'Collection') {
    return score * CLIENT_SIDE_SEARCH_WEIGHT_FOR_COLLECTION_RESULTS;
  }
  return score;
};

export const ClientSideSearchProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const prevSearchContext = useContext(SearchContext);
  if (prevSearchContext) {
    throw new Error('Cannot have multiple SearchContexts');
  }
  const {
    collections,
    loading: loadingCollections,
    error: errorLoadingCollections,
    suggestSync,
  } = useList();

  const [searchInputValue, setSearchInputValue] = useState('');
  const [clientSideFilter, setClientSideFilter] = useState<
    ((item: ListItemOrCollection) => boolean) | undefined
  >(undefined);
  const [hitsPerPage, setHitsPerPage] = useState(DEFAULT_HITS_PER_PAGE);

  const list = useFlatListWithCollections(collections, clientSideFilter);

  const { byShortcut } = useShortcuts('cache-first');
  const shortcutStaticId = byShortcut[searchInputValue.toLowerCase()]?.staticId;
  const shortcutResult = useMemo(() => {
    return (
      (shortcutStaticId &&
        list.find((i): i is ListItemType => {
          if (i.__typename === 'Collection') {
            return false;
          }
          return i.staticId === shortcutStaticId;
        })) ||
      null
    );
  }, [list, shortcutStaticId]);

  const fuseResults = useFuse(list, searchInputValue, { limit: hitsPerPage });
  const searchResults = useMemo(() => {
    return sortBy(fuseResults, weightedClientSideSearchScore).map(
      (result) => result.item
    );
  }, [fuseResults]);

  const onChangeFilters = useCallback((filters: SearchFilters) => {
    const clientSideFilter = translateFiltersToFunction(filters);
    setClientSideFilter(() => clientSideFilter);
  }, []);

  if (!searchResults) {
    captureMessage('Unexpected error loading search results');
  }

  const value = useMemo(
    () => ({
      error: errorLoadingCollections,
      loading: loadingCollections,
      searchInputValue,
      searchResults,
      setFilters: onChangeFilters,
      setHitsPerPage,
      setSearchInputValue,
      // No event tracking for client-side provider for now
      trackSearchEvent: () => {},
      shortcutResult,
      suggestSync,
    }),
    [
      errorLoadingCollections,
      loadingCollections,
      onChangeFilters,
      searchInputValue,
      searchResults,
      shortcutResult,
      suggestSync,
    ]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};
