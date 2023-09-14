import { map } from 'lodash';

import mockMessageRouter from '../../__mocks__/@michaelschade/kenchi-message-router';
import PageDataController from '../../pageContext/pageData/PageDataController';
import { IntercomExtractor } from '../../pageContext/pageData/variableExtractors/intercom';
import toolFactory from '../../test/factories/tool';
import {
  clearMockMessageRouter,
  expectSentCommand,
} from '../../test/helpers/messageRouter';
import { waitFor } from '../../testUtils';
import gmailAction from './GmailAction';

const slateConfig = {
  data: {
    slate: true,
    rich: true,
    singleLine: false,
    children: [{ text: 'Hello World!' }],
  },
};

jest.mock('../../pageContext/pageData/variableExtractors/intercom.ts');

describe('page actions', () => {
  beforeEach(() => {
    clearMockMessageRouter();
    mockMessageRouter.addCommandHandler('contentScript', 'insertText', () =>
      Promise.resolve({ success: true, result: true })
    );
  });
  it('applies configured intercom tags', async () => {
    const MockIntercomExtractor = jest.mocked(IntercomExtractor, true);
    MockIntercomExtractor.mockClear();

    const pageDataController = new PageDataController(mockMessageRouter);
    pageDataController.setPageUrl(
      new URL(
        'https://app.intercom.com/a/apps/mya415ow/inbox/inbox/all/conversations/26964863021'
      )
    );

    pageDataController.onDomainSettingsUpdate({
      name: null,
      open: null,
      side: null,
      customPlacements: null,
      insertionPath: null,
      variableExtractors: [{ intercom: {} }],
    });
    const tool = toolFactory.build({
      configuration: {
        ...slateConfig,
        intercomTags: ['44235345', '564345345'],
      },
    });
    const intercomTagObjectIds = map(
      tool.configuration.intercomTags,
      (tag: string) => `${tag}-objectid`
    );
    const intercomExtractorInstance = MockIntercomExtractor.mock.instances[0];
    const mockGetApplicationData = jest.mocked(
      intercomExtractorInstance.getTagApplicationData
    );
    const mockedTagApplicationData = {
      use: 'conversationPart' as const,
      data: {
        adminId: '123',
        conversationPartId: '26964863021',
        tagIds: intercomTagObjectIds,
      },
    };
    mockGetApplicationData.mockReturnValue(mockedTagApplicationData);

    gmailAction.execute(
      mockMessageRouter,
      pageDataController,
      null,
      {},
      tool.configuration
    );
    await waitFor(() => {
      expect(mockGetApplicationData).toHaveBeenCalledWith(
        tool.configuration.intercomTags
      );
      expectSentCommand({
        destination: 'pageScript',
        command: 'intercomApplyTags',
        args: mockedTagApplicationData.data,
      });
    });
  });

  it('adds zendesk tags', async () => {
    const pageDataController = new PageDataController(mockMessageRouter);
    pageDataController.setPageUrl(
      new URL('https://d3v-kenchi.zendesk.com/agent/tickets/51')
    );

    const tool = toolFactory.build({
      configuration: {
        ...slateConfig,
        zendeskTags: {
          tagsToAdd: ['meow', 'mix', 'please', 'deliver'],
        },
      },
    });
    gmailAction.execute(
      mockMessageRouter,
      pageDataController,
      null,
      {},
      tool.configuration
    );
    await waitFor(() => {
      expectSentCommand({
        destination: 'pageScript',
        command: 'zendeskAddTags',
        args: { tags: ['meow', 'mix', 'please', 'deliver'] },
      });
    });
  });

  it('sets zendesk tags', async () => {
    const pageDataController = new PageDataController(mockMessageRouter);
    pageDataController.setPageUrl(
      new URL('https://d3v-kenchi.zendesk.com/agent/tickets/51')
    );

    const tool = toolFactory.build({
      configuration: {
        ...slateConfig,
        zendeskTags: {
          tagsToSet: ['meow', 'mix', 'please', 'deliver'],
        },
      },
    });
    gmailAction.execute(
      mockMessageRouter,
      pageDataController,
      null,
      {},
      tool.configuration
    );
    await waitFor(() => {
      expectSentCommand({
        destination: 'pageScript',
        command: 'zendeskSetTags',
        args: { tags: ['meow', 'mix', 'please', 'deliver'] },
      });
    });
  });

  it('removes zendesk tags', async () => {
    const pageDataController = new PageDataController(mockMessageRouter);
    pageDataController.setPageUrl(
      new URL('https://d3v-kenchi.zendesk.com/agent/tickets/51')
    );

    const tool = toolFactory.build({
      configuration: {
        ...slateConfig,
        zendeskTags: {
          tagsToRemove: ['meow', 'mix', 'please', 'deliver'],
        },
      },
    });
    gmailAction.execute(
      mockMessageRouter,
      pageDataController,
      null,
      {},
      tool.configuration
    );
    await waitFor(() => {
      expectSentCommand({
        destination: 'pageScript',
        command: 'zendeskRemoveTags',
        args: { tags: ['meow', 'mix', 'please', 'deliver'] },
      });
    });
  });

  it('adds and removes zendesk tags at the same time', async () => {
    const pageDataController = new PageDataController(mockMessageRouter);
    pageDataController.setPageUrl(
      new URL('https://d3v-kenchi.zendesk.com/agent/tickets/51')
    );

    const tool = toolFactory.build({
      configuration: {
        ...slateConfig,
        zendeskTags: {
          tagsToAdd: ['meow', 'mix'],
          tagsToRemove: ['please', 'deliver'],
        },
      },
    });
    gmailAction.execute(
      mockMessageRouter,
      pageDataController,
      null,
      {},
      tool.configuration
    );
    await waitFor(() => {
      expectSentCommand({
        destination: 'pageScript',
        command: 'zendeskAddTags',
        args: { tags: ['meow', 'mix'] },
      });
      expectSentCommand({
        destination: 'pageScript',
        command: 'zendeskRemoveTags',
        args: { tags: ['please', 'deliver'] },
      });
    });
  });

  it('can assign a zendesk ticket to self', async () => {
    const pageDataController = new PageDataController(mockMessageRouter);
    pageDataController.setPageUrl(
      new URL('https://d3v-kenchi.zendesk.com/agent/tickets/51')
    );

    const tool = toolFactory.build({
      configuration: {
        ...slateConfig,
        zendeskAssign: { userId: 'self' },
      },
    });
    gmailAction.execute(
      mockMessageRouter,
      pageDataController,
      null,
      {},
      tool.configuration
    );
    await waitFor(() => {
      expectSentCommand({
        destination: 'pageScript',
        command: 'zendeskAssignMe',
      });
    });
  });

  it('can set Zendesk ticket status', async () => {
    const pageDataController = new PageDataController(mockMessageRouter);
    pageDataController.setPageUrl(
      new URL('https://d3v-kenchi.zendesk.com/agent/tickets/51')
    );

    const tool = toolFactory.build({
      configuration: {
        ...slateConfig,
        zendeskSetTicketStatus: 'pending',
      },
    });
    gmailAction.execute(
      mockMessageRouter,
      pageDataController,
      null,
      {},
      tool.configuration
    );
    await waitFor(() => {
      expectSentCommand({
        destination: 'pageScript',
        command: 'zendeskSetTicketStatus',
        args: { ticketStatus: 'pending' },
      });
    });
  });
});
