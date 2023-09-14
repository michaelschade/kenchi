import router from '../__mocks__/@michaelschade/kenchi-message-router';
import {
  clearMockMessageRouter,
  expectSentCommand,
} from '../__testHelpers/helpers/messageRouter';
import {
  originObserver,
  ReduxStoreObserver,
  ReduxSubscriberCallback,
} from './reduxStoreObserver';

const frontReduxStoreSubscribers: ReduxSubscriberCallback[] = [];
const store = {
  getState: jest.fn(),
  subscribe: (callback: ReduxSubscriberCallback) =>
    frontReduxStoreSubscribers.push(callback),
};

const conversationId = '41920087948';
const userId = '10987788';
const user = {
  id: userId,
  email: 'from_someone@example.com',
  givenName: 'To',
  familyName: 'Someone',
};
const conversation = {
  recipient: {
    role: 'to',
    // I know the two and from do not match up here. The recipient here is who will receive the message when we reply
    handle: 'from_somebody@example.com',
    name: 'From Somebody',
  },
};
const reduxData = {
  data: {
    userId,
    teammates: {
      [userId]: user,
    },
    conversations: {
      byId: {
        [conversationId]: conversation,
      },
    },
  },
};

// So we can user window.location.pathname
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    pathname: 'about:blank',
  },
});

beforeEach(() => clearMockMessageRouter());
describe('ReduxStoreObserver', () => {
  beforeEach(() => (frontReduxStoreSubscribers.length = 0));

  it('sends an update upon subscription', () => {
    window.location.pathname = `/inboxes/teams/folders/13337420/unassigned/${conversationId}`;

    store.getState.mockReturnValue(reduxData);
    const reduxStoreObserver = new ReduxStoreObserver(store);
    reduxStoreObserver.subscribe(originObserver(router, 'app'));
    expectSentCommand({
      destination: 'app',
      command: 'frontCommand',
      args: {
        type: 'data:recordsUpdated',
        records: [
          { type: 'teammate', data: user },
          { type: 'conversation', data: conversation },
        ],
      },
    });
  });

  it('sends an update when the redux store changes', () => {
    window.location.pathname = '/inboxes/teams/assigned/13337420/inbox/open/0'; // Front uses 0 as a sentinel value when there are no conversations

    store.getState.mockReturnValue(reduxData);
    const reduxStoreObserver = new ReduxStoreObserver(store);
    reduxStoreObserver.subscribe(originObserver(router, 'hud'));

    window.location.pathname = `/inboxes/teams/folders/13337420/unassigned/${conversationId}`;
    frontReduxStoreSubscribers.forEach((callback) => callback());

    expectSentCommand({
      destination: 'hud',
      command: 'frontCommand',
      args: {
        type: 'data:recordsUpdated',
        records: [
          { type: 'teammate', data: user },
          { type: 'conversation', data: conversation },
        ],
      },
    });
  });
});

describe('originObserver', () => {
  it('creates an observer for the specified origin', () => {
    const observer = originObserver(router, 'app');
    const messageData = { data: 'message data' };
    observer.next(messageData);
    expectSentCommand({
      command: 'frontCommand',
      destination: 'app',
      args: messageData,
    });
  });

  it('does not create two observers for the same origin', () => {
    const firstHudObserver = originObserver(router, 'hud');
    const secondHudObserver = originObserver(router, 'hud');
    const anAppObserver = originObserver(router, 'app');
    expect(firstHudObserver).toBe(secondHudObserver);
    expect(firstHudObserver).not.toBe(anAppObserver);
  });
});
