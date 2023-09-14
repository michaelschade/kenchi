import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import collectionFactory from '../test/factories/collection';
import searchConfigFactory from '../test/factories/searchConfig';
import toolFactory from '../test/factories/tool';
import userFactory from '../test/factories/user';
import {
  clearMockMessageRouter,
  sendCommand,
} from '../test/helpers/messageRouter';
import {
  algoliaHit,
  createAlgoliaResponse,
  createSearchClient,
  MockSearchProvider,
} from '../test/helpers/search';
import { expectSearchEvent } from '../test/helpers/searchAnalytics';
import { render, waitFor } from '../testUtils';
import SearchResults from './SearchResults';

const collection = collectionFactory
  .withTools(toolFactory.buildList(1))
  .build();
const tool = collection.tools.edges[0].node;
const user = userFactory.withCollections([collection]).build();
const searchConfig = searchConfigFactory.build();
const searchClient = createSearchClient({
  ...searchConfig,
  searchResult: createAlgoliaResponse({
    hits: [
      algoliaHit({
        name: tool.name,
        objectID: tool.staticId,
      }),
    ],
  }),
});

beforeEach(() => clearMockMessageRouter());
describe('search analytics', () => {
  it('sends search analytics', async () => {
    const { findByTitle } = render(
      <MockSearchProvider
        searchConfig={searchConfig}
        searchClient={searchClient}
      >
        <SearchResults collectionIds={[tool.collection.id]} />
      </MockSearchProvider>,
      { apolloResolvers: { Viewer: { user: () => user } } }
    );
    await act(async () => {
      sendCommand('pageScript', 'updateSearch', {
        value: tool.name,
      });
    });

    userEvent.click(await findByTitle('Preview snippet'));

    await waitFor(() => {
      expectSearchEvent({
        eventName: 'click',
        objectID: tool.staticId,
        position: 1,
      });
    });
  });
});
