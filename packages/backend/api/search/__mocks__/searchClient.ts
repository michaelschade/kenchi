import { map, random } from 'lodash';

import { SearchAPIClientInit } from '../searchClient';

export const nullAlgoliaClient: SearchAPIClientInit = (_apiKey: string) => {
  return {
    index: {
      saveObjects: (searchObjects) => {
        return Promise.resolve({
          taskIDs: [random(1, 10000)],
          objectIDs: map(searchObjects, 'objectID'),
        });
      },
      deleteObjects: (objectIDs) => {
        return Promise.resolve({
          taskIDs: [random(1, 10000)],
          objectIDs: objectIDs,
        });
      },
      search: (query) => {
        return Promise.resolve({
          query,
          hits: [],
          nbHits: 0,
          nbPages: 0,
          page: 1,
          hitsPerPage: 0,
          processingTimeMS: 1,
          exhaustiveNbHits: true,
          params: '',
        });
      },
      setSettings: () => {
        return Promise.resolve({
          taskID: random(1, 10000),
          updatedAt: Math.floor(Date.now() / 1000),
        });
      },
    },
    client: {
      generateSecuredApiKey: (_parentApiKey, restrictions) => {
        const { filters } = restrictions;
        return `restricted_search_key|${filters}`;
      },
    },
  };
};

const initSearchClient: SearchAPIClientInit = (apiKey: string) =>
  nullAlgoliaClient(apiKey);

export default initSearchClient;
