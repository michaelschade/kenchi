import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import collectionFactory from '../test/factories/collection';
import { MockSearchProvider } from '../test/helpers/search';
import {
  expectNoSearchEvents,
  expectSearchEvent,
} from '../test/helpers/searchAnalytics';
import { render } from '../testUtils';
import WorkflowPreview from './CollectionPreview';

const collection = collectionFactory.build();
describe('search analytics tracking', () => {
  it('sends search analytics', async () => {
    const { findByText } = render(
      <MockSearchProvider searchInput={collection.name}>
        <WorkflowPreview collection={collection} searchIndex={0} />
      </MockSearchProvider>
    );
    userEvent.click(await findByText(collection.name));
    await waitFor(() => {
      expectSearchEvent({
        eventName: 'click',
        objectID: collection.id,
        position: 1,
      });
    });
  });

  it('does not send an event without a search index', async () => {
    const { findByText } = render(
      <MockSearchProvider searchInput={collection.name}>
        <WorkflowPreview collection={collection} />
      </MockSearchProvider>
    );
    userEvent.click(await findByText(collection.name));
    await waitFor(() => {
      expectNoSearchEvents();
    });
  });
});
