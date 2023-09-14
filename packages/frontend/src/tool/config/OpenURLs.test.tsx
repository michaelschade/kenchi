import mockMessageRouter from '../../__mocks__/@michaelschade/kenchi-message-router';
import toolFactory from '../../test/factories/tool';
import {
  buildPageDataController,
  mockFormatter,
} from '../../test/helpers/pageDataController';
import { waitFor } from '../../testUtils';
import OpenURLs from './OpenURLs';

it('opens a URL', async () => {
  const pageDataController = buildPageDataController({
    formatter: mockFormatter({ formatText: () => 'http://example.com' }),
  });

  const tool = toolFactory.build({
    configuration: { urls: [{ text: 'http://example.com' }] },
  });

  window.open = jest.fn();
  OpenURLs.execute(
    mockMessageRouter,
    pageDataController,
    null,
    {},
    tool.configuration
  );
  await waitFor(() =>
    expect(window.open).toHaveBeenCalledWith('http://example.com')
  );
});
