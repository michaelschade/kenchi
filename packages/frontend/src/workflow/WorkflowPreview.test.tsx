import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import workflowFactory from '../test/factories/workflow';
import { MockSearchProvider } from '../test/helpers/search';
import {
  expectNoSearchEvents,
  expectSearchEvent,
} from '../test/helpers/searchAnalytics';
import { render } from '../testUtils';
import WorkflowPreview from './WorkflowPreview';

const workflow = workflowFactory.build();
describe('search analytics tracking', () => {
  it('sends search analytics', async () => {
    const { findByText } = render(
      <MockSearchProvider searchInput={workflow.name}>
        <WorkflowPreview workflow={workflow} searchIndex={0} />
      </MockSearchProvider>
    );
    userEvent.click(await findByText(workflow.name));
    await waitFor(() => {
      expectSearchEvent({
        eventName: 'click',
        objectID: workflow.staticId,
        position: 1,
      });
    });
  });

  it('does not send an event without a search index', async () => {
    const { findByText } = render(
      <MockSearchProvider searchInput={workflow.name}>
        <WorkflowPreview workflow={workflow} />
      </MockSearchProvider>
    );
    userEvent.click(await findByText(workflow.name));
    await waitFor(() => {
      expectNoSearchEvents();
    });
  });
});
