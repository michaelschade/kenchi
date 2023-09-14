import { merge, values } from 'lodash';

import { failure, success } from '@kenchi/shared/lib/Result';

import mockMessageRouter from '../../../__mocks__/@michaelschade/kenchi-message-router';
import { expectSentCommand } from '../../../test/helpers/messageRouter';
import { waitFor } from '../../../testUtils';
import EmberSync from './EmberSync';
import { IntercomExtractor } from './intercom';

const INTERCOM_APP_ID = 'mya415ow';
// Truncated intercom response mostly exposing the data we use for variable
// population
function buildConversationResponse(
  conversationId: number,
  email: string,
  name: string,
  user_id: string
) {
  return {
    id: conversationId,
    title: null,
    user_summary: {
      id: '5fd25c091e9ef4a6061d3d4f',
      name,
      pseudonym: 'Grey Locomotive from San Francisco',
      email,
      role: 'contact_role',
      user_id,
      company_ids: ['609437c56a7db61d22c35c46'],
      image_url:
        'https://static.intercomassets.com/app/pseudonym_avatars_2019/grey-locomotive.png',
      geoip_data: {
        city_name: 'San Francisco',
        country_name: 'United States',
      },
      first_company: {
        id: '609437c56a7db61d22c35c46',
        name: null,
      },
    },
    state: 'open',
    admin_assignee: {
      id: 3901888,
      name: 'Test Krausz',
    },
    team_assignee: {
      id: 0,
      name: 'Unassigned',
    },
    attributes: [],
    taggings: {
      conversation_part_tags: {},
      initial_part_tags: {
        initial_part: [],
      },
    },
    last_seen_by_user_at: null,
    visible_to_user: false,
    ticket_state: null,
  };
}

const ME_ADMIN_RESPONSE = {
  id: '5503945',
  name: 'Pantera Meowzhintar',
  first_name: 'Pantera',
  last_name: 'Meowzhintar',
  email: 'pantera@kenchi.com',
  apps: [
    {
      id: 'mya415ow',
      name: 'Kenchi [DEV]',
      is_test_app: false,
      test_app_id: null,
      is_default_app: true,
      permission_status: 'active',
      active_product_ids: [2, 1, 5, 8, 9],
      per_product_pricing_flow: true,
      has_inbox_access: true,
    },
  ],
  is_me: true,
  current_app_id: 'mya415ow',
  is_team: false,
  is_app_team: false,
  localized_sender_name: 'Peter from Kenchi [DEV]',
  role: null,
  status: null,
  department: 'Unknown',
  locale: 'en-US',
  last_active: 1654291832,
  visible_attribute_ids: ['email', 'user_id', 'owner_id'],
};

jest.mock('./EmberSync');
const MockEmberSync = EmberSync as jest.Mock<EmberSync>;

it('injects the script on init', async () => {
  const extractor = new IntercomExtractor();
  extractor.initialize(mockMessageRouter);
  expectSentCommand({
    destination: 'contentScript',
    command: 'injectScript',
    args: { name: 'intercom' },
  });
});

describe('updating variables', () => {
  let extractor: IntercomExtractor;
  let listener: jest.Mock;
  let variables: Record<string, string>;
  let fetchMockResponses: Record<string, Object>;
  let mockPageScriptFetch: jest.Mock;

  beforeEach(() => {
    extractor = new IntercomExtractor();
    extractor.initialize(mockMessageRouter);
    variables = {};
    listener = jest.fn(
      async (updatedVariables) => (variables = updatedVariables)
    );
    extractor.addListener(listener);
    fetchMockResponses = {};
    mockPageScriptFetch = jest.fn(async ({ resource }) => {
      const response = fetchMockResponses[resource];
      if (response) {
        return success(response);
      }
      return failure(`Test mock got unexpected resource request: ${resource}`);
    });

    mockMessageRouter.addCommandHandler(
      'pageScript',
      'intercomFetch',
      mockPageScriptFetch
    );
  });

  it('updates listeners when visiting intercom inbox', async () => {
    const conversationId = 26964863026;
    const conversationResource = `/ember/inbox/conversations/${conversationId}?app_id=${INTERCOM_APP_ID}`;
    const meResource = `/ember/admins/me.json?app_id=${INTERCOM_APP_ID}`;

    const conversationResponse = buildConversationResponse(
      conversationId,
      'robin.smith@exmaple.com',
      'Robin Smith',
      'a2b232db-87c5-422d-ab9f-0e757c1cab75'
    );
    fetchMockResponses = {
      [conversationResource]: conversationResponse,
      [meResource]: ME_ADMIN_RESPONSE,
    };

    extractor.setContext({
      url: new URL(
        `https://app.intercom.com/a/inbox/${INTERCOM_APP_ID}/inbox/shared/all/conversation/${conversationId}`
      ),
    });
    expect(mockPageScriptFetch).toHaveBeenCalledTimes(2);
    expect(mockPageScriptFetch).toHaveBeenCalledWith(
      {
        resource: conversationResource,
      },
      expect.anything(),
      expect.anything()
    );
    expect(mockPageScriptFetch).toHaveBeenCalledWith(
      {
        resource: meResource,
      },
      expect.anything(),
      expect.anything()
    );
    await waitFor(() =>
      expect(variables).toEqual({
        authorEmail: ME_ADMIN_RESPONSE.email,
        authorDomain: 'kenchi.com',
        authorName: ME_ADMIN_RESPONSE.name,
        authorFirstName: ME_ADMIN_RESPONSE.first_name,
        recipientEmail: conversationResponse.user_summary.email,
        recipientFirstName: 'Robin',
        recipientName: conversationResponse.user_summary.name,
        recipientUserID: conversationResponse.user_summary.user_id,
      })
    );
  });

  it('updates listeners when changing inbox conversations', async () => {
    const secondConversationId = 26964863021;
    const firstConversationResource = `/ember/inbox/conversations/26964863026?app_id=${INTERCOM_APP_ID}`;
    const secondConversationResource = `/ember/inbox/conversations/${secondConversationId}?app_id=${INTERCOM_APP_ID}`;
    const meResource = `/ember/admins/me.json?app_id=${INTERCOM_APP_ID}`;

    const secondConversationResponse = buildConversationResponse(
      secondConversationId,
      'batman.jones@exmaple.com',
      'Batman Jones',
      'a2b232db-87c5-422d-ab9f-cabcabbeef13'
    );

    fetchMockResponses = {
      [firstConversationResource]: buildConversationResponse(
        26964863026,
        'robin.smith@exmaple.com',
        'Robin Smith',
        'a2b232db-87c5-422d-ab9f-0e757c1cab75'
      ),
      [secondConversationResource]: secondConversationResponse,
      [meResource]: ME_ADMIN_RESPONSE,
    };

    extractor.setContext({
      url: new URL(
        `https://app.intercom.com/a/inbox/${INTERCOM_APP_ID}/inbox/shared/all/conversation/26964863026`
      ),
    });
    mockPageScriptFetch.mockClear();
    extractor.setContext({
      url: new URL(
        `https://app.intercom.com/a/inbox/${INTERCOM_APP_ID}/inbox/shared/all/conversation/${secondConversationId}`
      ),
    });
    expect(mockPageScriptFetch).toHaveBeenCalledTimes(2);
    expect(mockPageScriptFetch).toHaveBeenCalledWith(
      {
        resource: secondConversationResource,
      },
      expect.anything(),
      expect.anything()
    );
    expect(mockPageScriptFetch).toHaveBeenCalledWith(
      {
        resource: meResource,
      },
      expect.anything(),
      expect.anything()
    );
    await waitFor(() =>
      expect(variables).toEqual({
        authorEmail: ME_ADMIN_RESPONSE.email,
        authorDomain: 'kenchi.com',
        authorName: ME_ADMIN_RESPONSE.name,
        authorFirstName: ME_ADMIN_RESPONSE.first_name,
        recipientEmail: secondConversationResponse.user_summary.email,
        recipientFirstName: 'Batman',
        recipientName: secondConversationResponse.user_summary.name,
        recipientUserID: secondConversationResponse.user_summary.user_id,
      })
    );
  });

  it('also works for intercom.io', async () => {
    const conversationId = 26964863026;
    const conversationResource = `/ember/inbox/conversations/${conversationId}?app_id=${INTERCOM_APP_ID}`;
    const meResource = `/ember/admins/me.json?app_id=${INTERCOM_APP_ID}`;

    const conversationResponse = buildConversationResponse(
      conversationId,
      'robin.smith@exmaple.com',
      'Robin Smith',
      'a2b232db-87c5-422d-ab9f-0e757c1cab75'
    );
    fetchMockResponses = {
      [conversationResource]: conversationResponse,
      [meResource]: ME_ADMIN_RESPONSE,
    };

    extractor.setContext({
      url: new URL(
        `https://app.intercom.io/a/inbox/${INTERCOM_APP_ID}/inbox/shared/all/conversation/${conversationId}`
      ),
    });

    await waitFor(() =>
      expect(variables).toMatchObject({
        authorEmail: ME_ADMIN_RESPONSE.email,
        recipientEmail: conversationResponse.user_summary.email,
      })
    );
  });

  it('updates variables on the old Intercom UI', async () => {
    const conversationId = 26964863026;
    const participant = {
      name: 'Pantera Meowzhintar',
      display_as: 'Pantera Meowzhintar',
      email: 'pantera@kenchi.com',
      user_id: '5503945',
    };
    const context = {
      url: new URL(
        `https://app.intercom.com/a/apps/mya415ow/inbox/inbox/all/conversations/${conversationId}`
      ),
    };
    const mes = MockEmberSync.mock.instances[0];
    mes.recordsByType = {
      conversation: {
        [conversationId]: {
          extra: { participants: [participant.user_id] },
          objectId: conversationId,
        },
      },
      user: {
        [participant.user_id]: {
          columnValues: participant,
          objectId: participant.user_id,
        },
      },
    };
    mes.findObject = jest.fn((type, id) => mes.recordsByType[type][id]);

    extractor.setContext(context);
    await waitFor(() =>
      expect(variables).toEqual({
        recipientDomain: 'kenchi.com',
        recipientEmail: participant.email,
        recipientFirstName: 'Pantera',
        recipientName: participant.name,
        recipientUserID: participant.user_id,
      })
    );
  });

  describe('getting data to apply tags', () => {
    const tags = [
      { id: '12345', label: 'meow' },
      { id: '67890', label: 'woof' },
    ];
    const intercomTags = tags.map((tag) => ({ id: tag.id, name: tag.label }));
    let emberTagData: any;
    beforeEach(() => {
      emberTagData = intercomTags.reduce(
        (prev, { id, name }, index) => ({
          ...prev,
          [`ember${index + 1}`]: {
            columnValues: { id, name },
            objectId: `ember${index + 1}`,
          },
        }),
        {}
      );
      MockEmberSync.mock.instances[0].recordsByType = {
        tag: emberTagData,
      };
    });

    it('returns tag data for new intercom UI', async () => {
      const conversationId = 26964863026;
      extractor.setContext({
        url: new URL(
          `https://app.intercom.com/a/inbox/${INTERCOM_APP_ID}/inbox/shared/all/conversation/${conversationId}`
        ),
      });

      await waitFor(() => {
        const tagData = extractor.getTagApplicationData(tags.map((t) => t.id));
        expect(tagData).toEqual({
          use: 'inboxState',
          data: intercomTags,
        });
      });
    });

    it('returns tag data for old intercom UI', async () => {
      const conversationId = '26964863026';
      const participant = {
        name: 'Pantera Meowzhintar',
        display_as: 'Pantera Meowzhintar',
        email: 'pantera@kenchi.com',
        user_id: '5503945',
      };

      const mes = MockEmberSync.mock.instances[0];

      merge(mes.recordsByType, {
        conversation: {
          [conversationId]: { extra: { participants: [participant.user_id] } },
        },
        'conversation-part': {
          someConversationPartId: {
            columnValues: {
              conversation_id: conversationId,
              participant_id: participant.user_id,
              type: 'message',
              created_at: Date.now(),
            },
            objectId: 'someConversationPartId',
          },
        },
        user: {
          [participant.user_id]: { columnValues: participant },
        },
      });
      mes.me = {
        objectId: ME_ADMIN_RESPONSE.id,
        columnValues: participant,
      };
      const context = {
        url: new URL(
          `https://app.intercom.com/a/apps/mya415ow/inbox/inbox/all/conversations/${conversationId}`
        ),
      };

      extractor.setContext(context);
      await waitFor(() => {
        const tagData = extractor.getTagApplicationData(tags.map((t) => t.id));
        expect(tagData).toEqual({
          use: 'conversationPart',
          data: {
            adminId: participant.user_id,
            conversationPartId: 'someConversationPartId',
            tagIds: values(emberTagData).map((o: any) => o.objectId),
          },
        });
      });
    });
  });
});
