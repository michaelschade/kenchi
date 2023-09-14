import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SearchResponse } from '@algolia/client-search';
import { addBreadcrumb, captureMessage } from '@sentry/react';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import sortBy from 'lodash/sortBy';
import aa, { InsightsClient } from 'search-insights';
import { useThrottledCallback } from 'use-debounce';

import { SearchConfig } from '../graphql/generated';
import useSettings, { useRefetchSettings } from '../graphql/useSettings';
import useShortcuts from '../graphql/useShortcuts';
import useFuse from '../list/useFuse';
import useList, {
  ListItemType,
  useFlatListWithCollections,
} from '../list/useList';
import { filterNullOrUndefined } from '../utils';
import { weightedClientSideSearchScore } from './ClientSideSearchProvider';
import {
  ALGOLIA_SEARCH_THROTTLE_MS,
  DEFAULT_HITS_PER_PAGE,
  DEMO_COLLECTION_NAME,
} from './constants';
import { captureAlgoliaRetryError, isAlgoliaRetryError } from './errors';
import {
  SearchFilters,
  translateFiltersToAlgoliaFiltersParam,
  translateFiltersToFunction,
} from './filter';
import { createRequester } from './requester';
import { ListItemOrCollection, SearchContext } from './useSearch';

enum AlgoliaSearchStatus {
  error = 'error',
  nonError = 'nonError',
}

export const AlgoliaSearchProvider = ({
  children,
  searchConfig,
  searchClient,
  initialSearchInput,
}: {
  children: React.ReactNode;
  searchConfig: SearchConfig;
  searchClient?: SearchClient;
  initialSearchInput?: string;
}) => {
  const [algoliaSearchStatus, setAlgoliaSearchStatus] = useState(
    AlgoliaSearchStatus.nonError
  );
  const refetchSettings = useRefetchSettings();
  const { apiKey, apiKeyExpiration, appId, indexName, lastUpdated } =
    searchConfig;
  const searchKeyIsValid = new Date(apiKeyExpiration) > new Date();

  const requester = useMemo(
    () =>
      createRequester({
        onError: () => setAlgoliaSearchStatus(AlgoliaSearchStatus.error),
        onSuccess: () => setAlgoliaSearchStatus(AlgoliaSearchStatus.nonError),
        searchKeyLastUpdated: lastUpdated,
      }),
    [lastUpdated]
  );
  const defaultSearchClient = useMemo(
    () => algoliasearch(appId, apiKey, { requester }),
    [apiKey, appId, requester]
  );

  const algoliaIndex = useMemo(() => {
    return (searchClient || defaultSearchClient).initIndex(indexName);
  }, [defaultSearchClient, indexName, searchClient]);

  const insights = useMemo(() => {
    aa('init', { appId, apiKey });
    return aa;
  }, [apiKey, appId]);

  if (!searchKeyIsValid) {
    addBreadcrumb({
      category: 'search',
      message: 'Algolia search key is expired. Refetching settings.',
      data: {
        searchKeyLastUpdated: lastUpdated,
        clientCurrentTime: new Date().toISOString(),
        searchKeyAge: `${
          (Date.now() - new Date(lastUpdated).getTime()) / 1000 / 60
        } minutes`,
      },
      level: 'info',
    });
    refetchSettings();
  }

  return (
    <AlgoliaSearcher
      algoliaIndex={algoliaIndex}
      shouldDoClientSideSearch={
        !searchKeyIsValid || algoliaSearchStatus === AlgoliaSearchStatus.error
      }
      insights={insights}
      initialSearchInput={initialSearchInput}
    >
      {children}
    </AlgoliaSearcher>
  );
};

const AlgoliaSearcher = ({
  children,
  shouldDoClientSideSearch,
  algoliaIndex,
  insights,
  initialSearchInput,
}: {
  children: React.ReactNode;
  shouldDoClientSideSearch: boolean;
  algoliaIndex: SearchIndex;
  insights: InsightsClient;
  initialSearchInput?: string;
}) => {
  const prevSearchContext = useContext(SearchContext);
  if (prevSearchContext) {
    throw new Error('Cannot have multiple SearchContexts');
  }

  const [searchInputValue, setSearchInputValue] = useState(
    initialSearchInput ?? ''
  );
  const [clientSideFilter, setClientSideFilter] = useState<
    ((item: ListItemOrCollection) => boolean) | undefined
  >(undefined);
  const [algoliaFilters, setAlgoliaFilters] = useState('');
  const [algoliaQuery, setAlgoliaQuery] = useState(initialSearchInput ?? '');
  const [hitsPerPage, setHitsPerPage] = useState(DEFAULT_HITS_PER_PAGE);
  const [algoliaResponse, setAlgoliaResponse] = useState<SearchResponse | null>(
    null
  );
  const settings = useSettings();
  const userToken = settings?.viewer?.user?.id;
  useEffect(() => {
    if (!algoliaQuery) {
      setAlgoliaResponse(null);
      return;
    }
    let shouldSetAlgoliaResponse = true;
    (async () => {
      try {
        const algoliaResponse = await algoliaIndex.search(algoliaQuery, {
          filters: algoliaFilters,
          hitsPerPage,
          userToken,
          clickAnalytics: true,
        });
        if (shouldSetAlgoliaResponse) {
          setAlgoliaResponse(algoliaResponse);
        }
      } catch (error) {
        if (isAlgoliaRetryError(error)) {
          captureAlgoliaRetryError(error);
        } else {
          throw error;
        }
      }
    })();
    return () => {
      // Avoid setting state on an unmounted component
      shouldSetAlgoliaResponse = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algoliaFilters, algoliaQuery, hitsPerPage]);

  const {
    collections,
    loading: loadingCollections,
    error: errorLoadingCollections,
    suggestSync,
  } = useList();

  const demoCollectionId = useMemo(() => {
    if (!collections?.edges.length) {
      return;
    }
    return collections.edges.find((e) => e.node.name === DEMO_COLLECTION_NAME)
      ?.node.id;
  }, [collections]);
  const forceClientSideSearch =
    shouldDoClientSideSearch || !algoliaResponse || searchInputValue === '';

  const list = useFlatListWithCollections(
    collections,
    forceClientSideSearch ? clientSideFilter : undefined
  );
  const listMap = useMemo(() => {
    const map = new Map<string, ListItemOrCollection>();
    list.forEach((item) => {
      if (item.__typename === 'Collection') {
        map.set(item.id, item);
      } else {
        map.set(item.staticId, item);
      }
    });
    return map;
  }, [list]);

  const fuseResults = useFuse(list, searchInputValue, { limit: hitsPerPage });
  const searchResults = useMemo(() => {
    if (forceClientSideSearch) {
      return sortBy(fuseResults, weightedClientSideSearchScore).map(
        (result) => result.item
      );
    }
    const results = algoliaResponse.hits
      .map((hit) => {
        const result = listMap.get(hit.objectID);
        if (!result) {
          captureMessage('Algolia hit not found in list', {
            extra: {
              hitObjectId: hit.objectID,
            },
          });
        }
        return result;
      })
      // Filter out nulls and undefineds because while in practice we should
      // always find an item in the list corresponding to each hit, the return
      // type of Map.prototype.get is always possibly undefined
      .filter(filterNullOrUndefined);
    return results;
  }, [algoliaResponse, fuseResults, listMap, forceClientSideSearch]);

  const { byShortcut } = useShortcuts('cache-first');

  const shortcutStaticId = byShortcut[searchInputValue.toLowerCase()]?.staticId;
  const shortcutResult =
    (shortcutStaticId &&
      list.find((i): i is ListItemType => {
        if (i.__typename === 'Collection') {
          return false;
        }
        return i.staticId === shortcutStaticId;
      })) ||
    null;

  const throttledSetAlgoliaQuery = useThrottledCallback((query: string) => {
    setAlgoliaQuery(query);
  }, ALGOLIA_SEARCH_THROTTLE_MS);

  const onChangeQuery = useCallback(
    (query: string) => {
      setSearchInputValue(query);
      throttledSetAlgoliaQuery(query);
    },
    [throttledSetAlgoliaQuery]
  );

  const throttledTranslateAndSetAlgoliaFilters = useThrottledCallback(
    (filters: SearchFilters) => {
      const newAlgoliaFilters = translateFiltersToAlgoliaFiltersParam(filters);
      setAlgoliaFilters(newAlgoliaFilters);
    },
    ALGOLIA_SEARCH_THROTTLE_MS
  );

  const onChangeFilters = useCallback(
    (filters: SearchFilters) => {
      const filtersWithDemoCollectionId = {
        ...filters,
        demoCollectionId,
      };
      const clientSideFilter = translateFiltersToFunction(
        filtersWithDemoCollectionId
      );
      setClientSideFilter(() => clientSideFilter);
      throttledTranslateAndSetAlgoliaFilters(filtersWithDemoCollectionId);
    },
    [demoCollectionId, throttledTranslateAndSetAlgoliaFilters]
  );

  const throttledSetAlgoliaHitsPerPage = useThrottledCallback(
    (hitsPerPage: number) => {
      setHitsPerPage(hitsPerPage);
    },
    ALGOLIA_SEARCH_THROTTLE_MS
  );

  const onChangeHitsPerPage = useCallback(
    (hitsPerPage: number) => {
      throttledSetAlgoliaHitsPerPage(hitsPerPage);
    },
    [throttledSetAlgoliaHitsPerPage]
  );

  const onTrackEvent = useCallback(
    (eventName: string, objectID: string, position: number) => {
      const index = algoliaIndex.indexName;
      const queryID = algoliaResponse?.queryID;

      if (position < 1) {
        captureMessage(
          'Attempting to track search analytics with an invalid position',
          { extra: { position: position } }
        );
        return;
      }
      if (!userToken || !index || !queryID) {
        console.log(
          "Can't track search analytics without userToken, index, or queryID",
          { userToken, index, queryID }
        );
        return;
      }
      insights('clickedObjectIDsAfterSearch', {
        userToken,
        index,
        eventName,
        queryID: queryID,
        objectIDs: [objectID],
        positions: [position],
      });
    },
    [algoliaIndex.indexName, algoliaResponse?.queryID, insights, userToken]
  );
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
      setHitsPerPage: onChangeHitsPerPage,
      setSearchInputValue: onChangeQuery,
      trackSearchEvent: onTrackEvent,
      shortcutResult,
      suggestSync,
    }),
    [
      errorLoadingCollections,
      loadingCollections,
      onChangeFilters,
      onChangeHitsPerPage,
      onChangeQuery,
      onTrackEvent,
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
