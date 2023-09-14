import isEqual from 'fast-deep-equal';
import debounce from 'lodash/debounce';

import { KenchiMessageRouter } from '@kenchi/commands';

/*
The useful part of front's data store looks like
{
  data:
  userId:<USER_ID>,
  teammates:{
    <USER_ID>:{
      id:<USER_ID>,
      email:email@example.com,
      givenName: Some,
      familyName: Person,
    },
  }
  {
    conversations: {
      byId: {
        '<CONVERSATION_UUID>': { // The conversation's UUID is the last portion of the URL path
          recipient: {
            handle: "email@example.com",
            name: "Full Name",
            role: "to", // can be "to" or "from", but we only expect "to" here
          },
          // Note: we do not use this draft information right now
          draftMessageUuids: [<MESSAGE_UUID>], // list of message UUIDs,
          lastDraft: { // last draft can be null
            id: <MESSAGE_ID> //different from UUID
          },
        }
      }
    },
    messages: { // We do not currently use messages, but when a user starts a reply this will hold the draft message
      '<MESSAGE_UUID>': {
        id: '<MESSAGE_ID>',
        recipients: [{ // array of recipients
          handle: "email@example.com",
          name: "Full Name",
          role: "to", // "to" or "from"
        }],
      }
    },
  }
}
 */
// Export for tests
export type ReduxSubscriberCallback = () => void;
export type ReduxStore = {
  getState: () => Object;
  subscribe: (callback: () => void) => void;
};

// Right now this is geared toward's the Front integration but could be
// generalized to other Redux stores. The main assumptions that make this
// non-generic are:
// - This assumes a redux event is triggered any time the currently viewed
//   message/current context changes. This seems like a pretty safe assumption.
// - Thew way we grab the message ID from the URL isn't generic and would need
//   to be abstracted away.
type Observer = { next: (message: any) => void };
type StoredData = { conversation?: Object | null; teammate?: Object | null };
export class ReduxStoreObserver implements Observer {
  currentData: StoredData = {};
  subscribers: Set<Observer> = new Set();
  constructor(readonly store: ReduxStore) {
    this.next(store.getState());
    store.subscribe(
      debounce(() => this.next(store.getState()), 200, {
        leading: true,
        trailing: false,
        maxWait: 500,
      })
    );
  }

  subscribe(subscriber: Observer) {
    this.subscribers.add(subscriber);
    this.notifySubscribers(this.currentData, [subscriber]);
  }

  next(state: any) {
    const newData = this.extractDataForCurrentContext(state.data);
    if (!isEqual(newData, this.currentData)) {
      this.currentData = newData;

      if (this.subscribers.size > 0) {
        this.notifySubscribers(newData, this.subscribers);
      }
    }
  }

  private notifySubscribers(data: StoredData, subscribers: Iterable<Observer>) {
    // This could be smarter and only send back the data that changed,
    // but we are not sending back much data and this is simpler.
    const { teammate = {}, conversation = {} } = data;

    const event = {
      type: 'data:recordsUpdated',
      records: [
        { type: 'teammate', data: teammate },
        { type: 'conversation', data: conversation },
      ],
    };
    for (const subscriber of subscribers) {
      subscriber.next(event);
    }
  }

  private getConversationIds() {
    const pathname = window.location.pathname.split('/');
    return pathname[pathname.length - 1].split(',');
  }

  private extractDataForCurrentContext(data: any) {
    const teammate = data.teammates[data.userId];
    const conversation = this.extractCurrentConversation(data.conversations);
    return { teammate, conversation };
  }

  private extractCurrentConversation(conversations: any) {
    const conversationIds = this.getConversationIds();
    if (conversationIds.length !== 1 || !conversationIds[0].match(/[0-9]+/)) {
      return {};
    }
    const conversationId = conversationIds[0];
    const currentConversation = conversations.byId[conversationId];
    if (!currentConversation) {
      return {};
    }
    return currentConversation;
  }
}

const originObservers: { [origin: string]: Observer } = {};
export const originObserver = (
  router: KenchiMessageRouter<'pageScript'>,
  origin: string // but realistically, only 'app' | 'hud'
) => {
  let observer = originObservers[origin];
  if (!observer) {
    observer = {
      next: (message: any) => {
        router.sendCommand(origin, 'frontCommand', message);
      },
    };
    originObservers[origin] = observer;
  }
  return observer;
};
