import { Factory } from 'fishery';

import { SearchConfig } from '../../graphql/generated';

const searchConfigFactory = Factory.define<SearchConfig>(() => {
  return {
    __typename: 'SearchConfig',
    apiKey: 'fake_api_key',
    apiKeyExpiration: '2050-01-01T00:00:00.000Z',
    appId: 'fake_app_id',
    indexName: 'fake_index_name',
    shouldUseAlgolia: true,
    lastUpdated: '2020-01-01T00:00:00.000Z',
  };
});

export default searchConfigFactory;
