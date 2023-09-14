import { captureMessage } from '@sentry/react';
import { isEmpty, isEqual, maxBy } from 'lodash';

import { IntercomTag, KenchiMessageRouter } from '@kenchi/commands';
import Result, { failure, isFailure, success } from '@kenchi/shared/lib/Result';

import { isMessageRouterErrorType } from '../../../utils';
import { Context, Extractor, Variable, VariableListener } from '.';
import EmberSync, { EmberMessageBlob } from './EmberSync';

type Conversation = {
  user_summary: { email: string; name: string; user_id: string };
  lastUserComment: { renderableData: { tags: IntercomTag[] } };
};
type Admin = {
  email: string;
  first_name: string;
  last_name: string;
  name: string;
};
type Participant = {
  name?: string;
  display_as?: string;
  email?: string;
  user_id?: string;
  custom_data?: Record<string, any>;
};

type OldStyleTagApplicationData = {
  use: 'conversationPart';
  data: {
    adminId: any;
    conversationPartId: any;
    tagIds: string[];
  };
};
type NewStyleTagApplicationData = {
  use: 'inboxState';
  data: IntercomTag[];
};
type TagApplicationData =
  | NewStyleTagApplicationData
  | OldStyleTagApplicationData;

export class IntercomExtractor implements Extractor {
  private static CONVERSATION_REGEX =
    /\/a\/inbox\/(?<appId>[a-z0-9]+)\/.*\/conversation\/(?<conversationId>\d+)/;
  private emberSync?: EmberSync;
  private lastContextUpdate: number = 0;
  private messageRouter: KenchiMessageRouter<'app' | 'hud'> | undefined;
  private listeners: VariableListener[] = [];
  private context: Context = {};
  private currentVariables: Record<string, any> = {};
  private cachedIds: { conversationId: string; appId: string } = {
    conversationId: '',
    appId: '',
  };

  initialize(
    messageRouter: KenchiMessageRouter<'app' | 'hud'>
  ): void | (() => void) {
    this.messageRouter = messageRouter;
    const emberSync = new EmberSync(
      [
        'admin',
        'conversation',
        'conversation-part',
        'draft-conversation',
        'participant',
        'user',
        'tag',
      ],
      ['admin', 'conversation', 'conversation-part', 'participant', 'user'],
      (type, args) =>
        messageRouter.sendCommand('pageScript', 'emberCommand', {
          type,
          ...args,
        })
    );
    this.emberSync = emberSync;

    messageRouter.addCommandHandler(
      'pageScript',
      'emberCommand',
      emberSync.handleMessage
    );
    messageRouter
      .sendCommand('contentScript', 'injectScript', { name: 'ember' })
      .catch((error) => {
        // If alreadyInjected we probably have another Kenchi iframe interacting
        // with the page, so we missed the initial sync message. In an ideal
        // world it would've been queued up for us on initialization but that's
        // not happening for some reason.
        if (isMessageRouterErrorType(error, 'alreadyInjected')) {
          emberSync.resync();
        } else {
          throw error;
        }
      });
    messageRouter
      .sendCommand('contentScript', 'injectScript', {
        name: 'intercom',
      })
      .catch((error) => {
        if (isMessageRouterErrorType(error, 'alreadyInjected')) {
          console.log('Already injected, continuing');
        } else {
          throw error;
        }
      });
    return () =>
      messageRouter.removeCommandHandler(
        'pageScript',
        'emberCommand',
        emberSync.handleMessage
      );
  }

  public setContext(context: Context): void {
    this.lastContextUpdate = new Date().getTime();
    this.context = context;
    if (context.url) {
      this.updateVariables(context);
    }
  }

  public addListener(listener: VariableListener): void {
    this.listeners.push(listener);
    if (!isEmpty(this.currentVariables)) {
      this.updateListeners();
    }
  }

  public getPossibleVariables(): Variable[] {
    return [
      { id: 'authorEmail', placeholder: 'Author email' },
      { id: 'authorDomain', placeholder: 'Author domain' },
      { id: 'authorName', placeholder: 'Author name' },
      { id: 'authorFirstName', placeholder: 'Author first name' },
      { id: 'recipientEmail', placeholder: 'Recipient email' },
      { id: 'recipientDomain', placeholder: 'Recipient domain' },
      { id: 'recipientName', placeholder: 'Recipient name' },
      { id: 'recipientFirstName', placeholder: 'Recipient first name' },
      { id: 'recipientUserID', placeholder: 'Recipient user ID' },
    ];
  }

  public getEmberSync(): EmberSync | undefined {
    return this.emberSync;
  }

  public async getTags() {
    if (!this.emberSync) {
      return [];
    }
    return Object.values(this.emberSync.recordsByType['tag'] || {}).map(
      (tag) => ({ id: tag.columnValues.id, label: tag.columnValues.name })
    );
  }

  public getTagApplicationData(tags: string[]): TagApplicationData {
    if (!this.context.url) {
      throw new Error('Unable to apply tags without a context');
    }
    if (this.context.url.pathname.startsWith('/a/inbox')) {
      return this.getNewUITagApplicationData(tags);
    } else {
      return this.getOldUITagApplicationData(tags);
    }
  }

  private updateListeners() {
    this.listeners.forEach((listener) => {
      listener(this.currentVariables);
    });
  }

  private updateVariables(context: Context) {
    if (!context.url) {
      return;
    }
    if (context.url.pathname.startsWith('/a/inbox')) {
      this.updateNewUIVariables(context.url.pathname);
    } else {
      this.updateOldUIVariables();
    }
  }

  private async updateNewUIVariables(pathname: string): Promise<void> {
    const extractedIds = this.extractIds(pathname);
    if (!extractedIds) {
      return;
    }

    if (!isEqual(extractedIds, this.cachedIds)) {
      this.cachedIds = extractedIds;
      const fetchResults = await this.fetchIntercomData(extractedIds);
      if (isFailure(fetchResults)) {
        captureMessage(fetchResults.error);
        return;
      }
      const {
        me: author,
        conversation: { user_summary: recipient },
      } = fetchResults.data;
      this.currentVariables = {
        authorEmail: author.email,
        authorDomain: author.email.split('@')[1],
        authorFirstName: author.first_name,
        authorName: author.name,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        recipientFirstName: recipient.name.split(' ')[0],
        recipientUserID: recipient.user_id,
      };
    }
    this.updateListeners();
  }

  private async fetchIntercomData({
    conversationId,
    appId,
  }: {
    conversationId: string;
    appId: string;
  }): Promise<Result<{ conversation: Conversation; me: Admin }, string>> {
    if (!this.messageRouter) {
      throw new Error(
        'Fetching intercom data without initializing a message router'
      );
    }
    const [conversationResponse, meResponse] = await Promise.all([
      this.messageRouter.sendCommand('pageScript', 'intercomFetch', {
        resource: this.conversationResource(conversationId, appId),
      }),
      this.messageRouter.sendCommand('pageScript', 'intercomFetch', {
        resource: this.meResource(appId),
      }),
    ]);

    if (
      isFailure(conversationResponse) ||
      !this.isConversation(conversationResponse.data)
    ) {
      const failureMessage = isFailure(conversationResponse)
        ? conversationResponse.error
        : `Unexpected conversation data: ${JSON.stringify(
            conversationResponse.data
          )}`;
      return failure(failureMessage);
    }
    if (isFailure(meResponse) || !this.isAdmin(meResponse.data)) {
      const failureMessage = isFailure(meResponse)
        ? meResponse.error
        : `Unexpected admin data: ${JSON.stringify(meResponse.data)}`;
      return failure(failureMessage);
    }

    return success({
      conversation: conversationResponse.data,
      me: meResponse.data,
    });
  }

  private extractIds(
    pathname: string
  ): { conversationId: string; appId: string } | null {
    const matchResult = IntercomExtractor.CONVERSATION_REGEX.exec(pathname);
    if (!matchResult || !matchResult.groups) {
      return null;
    }
    const { conversationId, appId } = matchResult.groups;
    return { conversationId, appId };
  }

  private conversationResource(conversationId: string, appId: string) {
    return `/ember/inbox/conversations/${conversationId}?app_id=${appId}`;
  }

  private meResource(appId: string) {
    return `/ember/admins/me.json?app_id=${appId}`;
  }

  private isConversation(data: Record<string, any>): data is Conversation {
    return (
      'user_summary' in data &&
      'email' in data.user_summary &&
      'name' in data.user_summary &&
      'user_id' in data.user_summary
    );
  }

  private isAdmin(data: Record<string, any>): data is Admin {
    return (
      'email' in data &&
      'first_name' in data &&
      'last_name' in data &&
      'name' in data
    );
  }

  private updateOldUIVariables = (_record?: EmberMessageBlob) => {
    if (!this.emberSync) {
      throw new Error('Must call initialize first');
    }

    if (!this.context.url) {
      return;
    }

    this.emberSync.clearObservers();
    this.currentVariables = this.getOldUIVariables(this.context.url);
    this.updateListeners();
  };

  private getOldUIVariables(url: URL) {
    if (!this.emberSync) {
      throw new Error('Must call initialize first');
    }

    const pathParts = url.pathname.split('/');
    let participant: Participant | null = null;

    const conversationsIndex = pathParts.findIndex((p) =>
      p.startsWith('conversation')
    );
    const usersIndex = pathParts.findIndex((p) => p === 'users');

    if (pathParts[pathParts.length - 1] === 'new-conversation') {
      this.emberSync.observeRecord(
        'draft-conversation',
        '0',
        this.updateOldUIVariables
      );
      const draft = this.emberSync.findObject('draft-conversation', '0');
      const recipient: string | undefined =
        draft?.columnValues.recipient_ids[0];
      if (draft && recipient) {
        if (recipient.startsWith('new-user-')) {
          const newUser =
            draft.columnValues.new_users[
              parseInt(recipient.substring('new-user-'.length))
            ];
          // Incidentally contains an `email` field so this will conform to the Participant type
          participant = newUser;
        } else {
          participant = this.getAndObserveParticipant(recipient);
        }
      }
    } else if (conversationsIndex !== -1) {
      const conversationId = pathParts[conversationsIndex + 1];
      participant = this.getMainParticipant(conversationId);
      if (!participant && this.emberSync.initialLoadComplete) {
        const now = new Date().getTime();
        if (this.lastContextUpdate + 1000 < now) {
          captureMessage(
            'On Intercom conversation page but could not find participant'
          );
        }
      }
    } else if (usersIndex !== -1) {
      const userId = pathParts[usersIndex + 1];
      participant = this.getAndObserveParticipant(userId);
    }

    const activeVariables: { [key: string]: string } = {};

    if (participant) {
      // When email is missing we get {} instead of ""
      if (participant.email && typeof participant.email === 'string') {
        activeVariables.recipientEmail = participant.email;
        activeVariables.recipientDomain = participant.email.split('@')[1];
      }

      let nameToParse = null;
      // When name is missing we get {} instead of ""
      if (participant.name && typeof participant.name === 'string') {
        nameToParse = participant.name;
      } else if (
        participant.display_as &&
        typeof participant.display_as === 'string'
      ) {
        // TODO: figure out if this is the only auto-gen pseudonym style
        if (participant.display_as.indexOf(' from ') === -1) {
          nameToParse = participant.display_as;
        }
      }

      if (nameToParse) {
        activeVariables.recipientName = nameToParse;
        activeVariables.recipientFirstName = nameToParse.split(' ')[0];
      }

      if (participant.user_id && typeof participant.user_id !== 'object') {
        activeVariables.recipientUserID = participant.user_id;
      }
    }

    this.emberSync.observeMe(this.updateOldUIVariables);
    if (this.emberSync.me) {
      activeVariables.authorEmail = this.emberSync.me.columnValues.email;
      activeVariables.authorDomain = activeVariables.authorEmail?.split('@')[1];
      activeVariables.authorName = this.emberSync.me.columnValues.name;
      activeVariables.authorFirstName =
        this.emberSync.me.columnValues.first_name;
    }

    return activeVariables;
  }

  private getAndObserveParticipant(id: string): Participant | null {
    if (!this.emberSync) {
      throw new Error('Must call initialize first');
    }

    this.emberSync.observeRecord('user', id, this.updateOldUIVariables);
    this.emberSync.observeRecord('participant', id, this.updateOldUIVariables);

    const user = this.emberSync.findObject('user', id);
    if (user) {
      return user.columnValues;
    }
    const participant = this.emberSync.findObject('participant', id);
    if (participant) {
      return participant.columnValues;
    }
    return null;
  }

  private getMainParticipant(conversationId: string) {
    if (!this.emberSync) {
      throw new Error('Must call initialize first');
    }

    const conversation = this.emberSync.findObject(
      'conversation',
      conversationId
    );
    this.emberSync.observeRecord(
      'conversation',
      conversationId,
      this.updateOldUIVariables
    );
    if (!conversation) {
      return null;
    }

    if (
      !conversation.extra.participants ||
      conversation.extra.participants.length === 0
    ) {
      return null;
    }

    const participantId = conversation.extra.participants[0];
    return this.getAndObserveParticipant(participantId);
  }

  private getNewUITagApplicationData(
    tags: string[]
  ): NewStyleTagApplicationData {
    const tagMap = this.getTagMap();
    const data = tags.map((tag) => ({ id: tag, name: tagMap[tag].name }));
    return { use: 'inboxState', data };
  }

  private getTagMap() {
    if (!this.emberSync) {
      return {};
    }
    return Object.values(this.emberSync.recordsByType['tag'] || {}).reduce(
      (acc, tag) => {
        const { id, name } = tag.columnValues;
        acc[id] = { id, name };
        return acc;
      },
      {}
    );
  }

  private getOldUITagApplicationData(
    tags: string[]
  ): OldStyleTagApplicationData {
    if (!this.context.url) {
      throw new Error(
        'Failed to get Intercom tag application data: No URL in context'
      );
    }

    if (!this.emberSync?.me) {
      throw new Error(
        "Failed to get Intercom tag application data: EmberSync missing 'me'"
      );
    }

    const adminId = this.emberSync.me.objectId;
    console.log(`Admin ID ${adminId}`);

    const pathParts = this.context.url.pathname.split('/');
    const conversationsIndex = pathParts.findIndex((p) =>
      p.startsWith('conversation')
    );
    if (conversationsIndex === -1) {
      throw new Error(
        "Failed to get Intercom tag application data: Can't find conversation ID in URL path"
      );
    }
    const conversationId = pathParts[conversationsIndex + 1];

    const conversationParts = Object.values(
      this.emberSync.recordsByType['conversation-part'] || {}
    );
    console.log(`Found ${conversationParts.length} total parts`);

    const relevantParts = conversationParts
      .filter((o) => o.columnValues['conversation_id'] === conversationId)
      .filter((o) => typeof o.columnValues['participant_id'] === 'string')
      .filter(
        (o) =>
          o.columnValues['type'] === 'message' ||
          o.columnValues['type'] === 'comment'
      );
    console.log(`Found ${relevantParts.length} relevant parts`);

    const latestPart = maxBy(relevantParts, (o) => o.columnValues.created_at);
    if (!latestPart) {
      throw new Error(
        "Failed to get Intercom tag application data: Can't find conversation"
      );
    }
    console.log(`Conversation part ID ${latestPart.objectId}`);

    const tagObjectIds = tags
      .map(
        (id) =>
          Object.values(this.emberSync?.recordsByType['tag'] || {}).find(
            (tag) => id === tag.columnValues['id']
          )?.objectId
      )
      .filter((t): t is string => !!t);
    console.log(`Tag IDs ${tagObjectIds.join(', ')}`);
    if (tagObjectIds.length === 0) {
      throw new Error(
        "Failed to get Intercom tag application data: Can't find tag object IDs"
      );
    }

    return {
      use: 'conversationPart',
      data: {
        adminId,
        conversationPartId: latestPart.objectId,
        tagIds: tagObjectIds,
      },
    };
  }
}
