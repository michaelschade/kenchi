import {
  ChunkedBatchResponse,
  SearchResponse,
  SetSettingsResponse,
  Settings,
} from '@algolia/client-search';
import algoliasearch from 'algoliasearch';

import { isDevelopment } from '../utils';
import { nullAlgoliaClient } from './__mocks__/searchClient';

function shouldUseRealClient() {
  return (
    !isDevelopment() ||
    process.env.ALGOLIA_ENABLE_IN_DEVELOPMENT?.toLowerCase() === 'true'
  );
}

export type SearchIndex = {
  saveObjects: (
    searchObjects: Readonly<{ objectID: string }>[]
  ) => Readonly<Promise<ChunkedBatchResponse>>;
  deleteObjects: (
    objectIDs: string[]
  ) => Readonly<Promise<ChunkedBatchResponse>>;
  setSettings: (settings: Settings) => Readonly<Promise<SetSettingsResponse>>;
  search: <TObject>(
    query: string
  ) => Readonly<Promise<SearchResponse<TObject>>>;
};

export type SearchAPIClient = {
  generateSecuredApiKey: (
    parentApiKey: string,
    restrictions: {
      filters?: string;
      restrictIndices?: string;
      validUntil?: number;
    }
  ) => string;
};

export type SearchAPIClientInit = (apiKey: string) => {
  index: SearchIndex;
  client: SearchAPIClient;
};

const algoliaClient: SearchAPIClientInit = (apiKey: string) => {
  const client = algoliasearch(process.env.ALGOLIA_APP_ID, apiKey);
  const index = client.initIndex(process.env.ALGOLIA_SEARCH_INDEX_NAME);

  return {
    index: {
      saveObjects: (searchObjects) => index.saveObjects(searchObjects),
      deleteObjects: (objectIDs) => index.deleteObjects(objectIDs),
      setSettings: (settings) => index.setSettings(settings),
      search: (query: string) => index.search(query),
    },
    client: {
      generateSecuredApiKey: (
        parentApiKey: string,
        restrictions: {
          filters?: string;
          restrictIndices?: string;
          validUntil?: number;
        }
      ): string => client.generateSecuredApiKey(parentApiKey, restrictions),
    },
  };
};

const initSearchClient: SearchAPIClientInit = (apiKey: string) => {
  if (shouldUseRealClient()) {
    return algoliaClient(apiKey);
  } else {
    return nullAlgoliaClient(apiKey);
  }
};

export default initSearchClient;
