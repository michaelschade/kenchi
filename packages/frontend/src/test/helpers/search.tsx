import { SearchResponse } from '@algolia/client-search';
import algoliasearch, { SearchClient } from 'algoliasearch/lite';

import { SearchConfig } from '../../graphql/generated';
import { AlgoliaSearchProvider } from '../../search/AlgoliaSearchProvider';
import searchConfigFactory from '../factories/searchConfig';

export const createSearchClient = ({
  appId,
  apiKey,
  searchResult,
}: {
  appId: string;
  apiKey: string;
  searchResult: SearchResponse;
}) =>
  algoliasearch(appId, apiKey, {
    requester: {
      send: (request) => {
        return Promise.resolve({
          content: JSON.stringify(searchResult),
          isTimedOut: false,
          status: 200,
        });
      },
    },
  });

export const algoliaHit = (
  overrides: {
    name?: string;
    keywords?: string[];
    collection?: Object;
    objectID?: string;
    _highlightResult?: Object;
  } = {}
) => ({
  name: 'Need account email',
  keywords: [],
  collection: {},
  objectID: 'tool_0SVvHtpozc',
  _highlightResult: {
    name: {
      value:
        '__ais-highlight__Need__/ais-highlight__ __ais-highlight__account__/ais-highlight__ __ais-highlight__email__/ais-highlight__',
      matchLevel: 'full',
      fullyHighlighted: true,
      matchedWords: ['need', 'account', 'email'],
    },
  },
  ...overrides,
});

export const createAlgoliaResponse = (
  {
    hits = [],
    query = 'need account email',
    queryID = 'fake-query-id',
    index = 'fake_app_index',
  }: {
    hits: ReturnType<typeof algoliaHit>[];
    query?: string;
    queryID?: string;
    index?: string;
  } = {
    hits: [],
    query: 'need account email',
    queryID: 'fake-query-id',
    index: 'fake_app_index',
  }
) => {
  return {
    hits,
    nbHits: hits.length,
    page: 0,
    nbPages: 1,
    hitsPerPage: 20,
    exhaustiveNbHits: true,
    exhaustiveTypo: true,
    query,
    queryID,
    params: 'fake_params',
    index,
    renderingContent: {},
    processingTimeMS: 1,
  };
};

export const defaultAlgoliaResponse = createAlgoliaResponse({
  hits: [algoliaHit()],
});

export const MockSearchProvider = ({
  searchConfig,
  searchClient,
  searchInput,
  children,
}: {
  searchConfig?: SearchConfig;
  searchClient?: SearchClient;
  searchInput?: string;
  children?: React.ReactNode;
}) => {
  const algoliaConfig = searchConfig || searchConfigFactory.build();
  const algoliaClient =
    searchClient ||
    createSearchClient({
      ...algoliaConfig,
      searchResult: defaultAlgoliaResponse,
    });

  return (
    <AlgoliaSearchProvider
      searchConfig={algoliaConfig}
      searchClient={algoliaClient}
      initialSearchInput={searchInput}
    >
      {children}
    </AlgoliaSearchProvider>
  );
};
