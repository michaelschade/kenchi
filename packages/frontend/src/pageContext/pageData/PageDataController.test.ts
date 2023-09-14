import mockMessageRouter from '../../__mocks__/@michaelschade/kenchi-message-router';
import extractIntercomData from '../actions/extractIntercomData';
import extractIntercomTags from '../actions/extractIntercomTags';
import PageDataController from './PageDataController';

jest.mock('../actions/extractIntercomData');
jest.mock('../actions/extractIntercomTags');

describe('running actions', () => {
  describe('on intercom', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('runs intercom actions', async () => {
      const pageDataController = new PageDataController(mockMessageRouter);
      pageDataController.setPageUrl(
        new URL(
          'https://app.intercom.com/a/apps/some_id/inbox/inbox/all/conversations/some_conversation_id'
        )
      );
      pageDataController.runAction('extractIntercomData');
      expect(extractIntercomData).toHaveBeenCalled();

      pageDataController.runAction('extractIntercomTags');
      expect(extractIntercomTags).toHaveBeenCalled();
    });

    it('does not run intercom actions on other domains', () => {
      const pageDataController = new PageDataController(mockMessageRouter);
      pageDataController.setPageUrl(
        new URL('https://d3v-kenchi.zendesk.com/agent/tickets/some_ticket_id')
      );

      expect(extractIntercomData).not.toHaveBeenCalled();
      expect(extractIntercomTags).not.toHaveBeenCalled();
    });
  });
});
