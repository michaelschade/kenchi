import { IntercomTag } from '@kenchi/commands';
import { failure, success } from '@kenchi/shared/lib/Result';

import { EMBER_VARIABLE_NAME } from '../ember';
import getMessageRouter from '../getMessageRouter';

const router = getMessageRouter();

router.addCommandHandler(
  ['app', 'hud'],
  'intercomApplyTags',
  async ({ adminId, conversationPartId, tagIds }) => {
    const emberInspector = window[EMBER_VARIABLE_NAME as any] as any;
    if (!emberInspector) {
      throw new Error('missingEmber');
    }
    const sentRecords = emberInspector.dataDebug.sentRecords;
    const admin = sentRecords[adminId];
    const conversationPart = sentRecords[conversationPartId];

    const tagObjectsById: Record<string, unknown> = {};
    tagIds.forEach((id) => {
      const record = sentRecords[id];
      if (record) {
        tagObjectsById[record.object.id] = record.object;
      } else {
        throw new Error('missingTagObject');
      }
    });

    console.log(`admin`, admin);
    console.log(`conversationPart`, conversationPart);
    console.log(`tagObjectsById`, tagObjectsById);

    if (!admin || !conversationPart) {
      throw new Error('missingObject');
    }

    const taggings = conversationPart.object.taggings;
    console.log(`taggings`, taggings);
    for (var i = 0; i < taggings.length; i++) {
      const id = taggings.objectAt(i).tag.id;
      if (tagObjectsById[id]) {
        delete tagObjectsById[id];
      }
    }

    conversationPart.object.updateTaggings(
      admin,
      Object.values(tagObjectsById)
    );

    return { success: true };
  }
);

router.addCommandHandler(
  ['app', 'hud'],
  'intercomFetch',
  async ({ resource, init = {} }, _command, _origin) => {
    const response = await fetch(resource, init);
    if (response.ok) {
      try {
        return success(await response.json());
      } catch (error) {
        return failure(`Unable to fetch '${resource}': ${error}`);
      }
    }
    return failure(response.statusText);
  }
);

router.addCommandHandler(
  ['app', 'hud'],
  'intercomAddTagsToCurrentConversation',
  async ({ tagData }, _command, _origin) => {
    const currentPath = window.location.pathname;
    const owner = getApplicationOwner();
    if (!owner) {
      return failure(
        `Unable to find ember application owner. Current path: ${currentPath}`
      );
    }
    const model = getCurrentConversation(owner);
    if (!model) {
      return failure(
        `Unable to find current conversation. Current path: ${currentPath}`
      );
    }
    if (!model.lastUserComment) {
      return failure(
        `Unable to find last user comment. Current path: ${currentPath}`
      );
    }

    const inboxState = registryLookup(owner, 'service:inbox-state');
    if (!inboxState) {
      return failure(
        `Unable to find inbox state service. Current path: ${currentPath}`
      );
    }
    const existingTags = model.lastUserComment.renderableData.tags || [];
    const existingTagIds = existingTags.map(({ id }: IntercomTag) => id);
    const newTags = tagData.filter(({ id }) => !existingTagIds.includes(id));
    console.log('New tags', newTags);
    inboxState.updateTags.perform(
      model,
      model.lastUserComment,
      existingTags.concat(newTags)
    );

    return success(tagData);
  }
);

function getApplicationOwner() {
  // @ts-ignore
  const applicationContainer = window.EmberApplicationInstance.__container__;
  return applicationContainer.owner;
}

function getCurrentConversation(owner: any) {
  const controller = registryLookup(
    owner,
    'controller:inbox/workspace/inbox/inbox/conversation/conversation'
  );
  return controller.model;
}

function registryLookup(owner: any, name: string) {
  return owner.resolveRegistration(name) && owner.lookup(name);
}

if (process.env.APP_ENV === 'development') {
  // @ts-ignore
  window.getApplicationOwner = getApplicationOwner;
  // @ts-ignore
  window.registryLookup = registryLookup;
  // @ts-ignore
  window.getCurrentConversation = getCurrentConversation;
}
