import { createContext, useContext } from 'react';

import { ApolloError } from '@apollo/client';
import { captureMessage } from '@sentry/react';

import { CollectionListItemFragment } from '../graphql/generated';
import { useSearchConfig } from '../graphql/useSettings';
import { ListItemType } from '../list/useList';
import { AlgoliaSearchProvider } from './AlgoliaSearchProvider';
import { TrackSearchEvent } from './analytics';
import { ClientSideSearchProvider } from './ClientSideSearchProvider';
import { SearchFilters } from './filter';

export type SearchContextType = {
  error?: ApolloError;
  loading: boolean;
  searchInputValue: string;
  searchResults: ListItemOrCollection[];
  setFilters: (filters: SearchFilters) => void;
  setHitsPerPage: (hitsPerPage: number) => void;
  setSearchInputValue: (query: string) => void;
  trackSearchEvent: TrackSearchEvent;
  shortcutResult: ListItemType | null;
  suggestSync: () => void;
};

export const SearchContext = createContext<SearchContextType | null>(null);

export const useSearch = () => {
  const searchContext = useContext(SearchContext);
  if (!searchContext) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return searchContext;
};

export const useSearchAnalytics = () => {
  const searchContext = useContext(SearchContext);
  if (!searchContext) {
    return {
      // Some components are not always used within a search provider (like
      // tools within the Slate editor) That's OK as long as they don't also try
      // to track search events
      trackSearchEvent: () =>
        captureMessage(
          'useSearchAnalytics being used outside of a SearchProvider'
        ),
    };
  }
  return { trackSearchEvent: searchContext.trackSearchEvent };
};

export type ListItemOrCollection = ListItemType | CollectionListItemFragment;

export const SearchProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const searchConfig = useSearchConfig();
  const shouldUseAlgolia = searchConfig?.shouldUseAlgolia;
  if (shouldUseAlgolia) {
    return (
      <AlgoliaSearchProvider searchConfig={searchConfig}>
        {children}
      </AlgoliaSearchProvider>
    );
  } else {
    return <ClientSideSearchProvider>{children}</ClientSideSearchProvider>;
  }
};
