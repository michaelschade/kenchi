import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import insights from 'search-insights';

import { SettingsProvider } from '../graphql/useSettings';
import searchConfigFactory from '../test/factories/searchConfig';
import userFactory from '../test/factories/user';
import {
  defaultAlgoliaResponse,
  MockSearchProvider,
} from '../test/helpers/search';
import { MockApolloProvider, waitFor } from '../testUtils';
import { useSearch } from './useSearch';

const defaultSearchConfig = searchConfigFactory.build();

const user = userFactory.build();
const viewer = {
  searchConfig: () => defaultSearchConfig,
  user: () => user,
};

const mockWrapper = ({ children }: { children: React.ReactNode }) => (
  <MockApolloProvider resolvers={{ Viewer: viewer }}>
    <SettingsProvider>
      <MockSearchProvider searchConfig={defaultSearchConfig}>
        {children}
      </MockSearchProvider>
    </SettingsProvider>
  </MockApolloProvider>
);
describe('tracking search events (insights)', () => {
  it('reports events for the current search', async () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: mockWrapper,
    });
    // Click tracking only makes sense after a search
    act(() => result.current.setSearchInputValue(defaultAlgoliaResponse.query));
    await waitFor(() => expect(result.current.searchResults).toBeDefined());

    act(() => result.current.trackSearchEvent('click', 'tool_meowmeowmeow', 3));
    await waitFor(() =>
      expect(insights).toBeCalledWith('clickedObjectIDsAfterSearch', {
        eventName: 'click',
        userToken: user.id,
        index: defaultSearchConfig.indexName,
        queryID: defaultAlgoliaResponse.queryID,
        objectIDs: ['tool_meowmeowmeow'],
        positions: [3],
      })
    );
  });

  it('does not report events when there has been no search query', async () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: mockWrapper,
    });

    act(() => result.current.trackSearchEvent('click', 'tool_meowmeowmeow', 3));
    await waitFor(() =>
      expect(insights).not.toBeCalledWith(
        'clickedObjectIDsAfterSearch',
        expect.anything()
      )
    );
  });
});
