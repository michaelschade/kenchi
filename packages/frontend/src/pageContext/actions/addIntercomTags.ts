import { IntercomTag, KenchiMessageRouter } from '@kenchi/commands';
import { failure, isSuccess, success } from '@kenchi/shared/lib/Result';

import { IntercomExtractor } from '../pageData/variableExtractors/intercom';
import { PageActionRunner } from './types';

const addIntercomTags: PageActionRunner<'addIntercomTags'> = async (
  { messageRouter, pageDataController },
  { tags }
) => {
  const intercomExtractor = pageDataController.getExtractor(
    'intercom'
  ) as IntercomExtractor | null;

  if (!intercomExtractor) {
    return failure({
      message: 'Applying intercom tags but intercom extractor not available',
      data: { tags },
    });
  }
  let tagApplicationData;
  try {
    tagApplicationData = intercomExtractor.getTagApplicationData(tags);
  } catch (error: any) {
    return failure({
      message: error.message,
      data: { tags },
    });
  }

  if (tagApplicationData.use === 'inboxState') {
    return applyTagsUsingInboxState(messageRouter, tagApplicationData.data);
  } else {
    return applyTagsUsingConversationPart(
      messageRouter,
      tagApplicationData.data
    );
  }
};

const applyTagsUsingInboxState = async (
  messageRouter: KenchiMessageRouter<'app' | 'hud'>,
  tagData: IntercomTag[]
) => {
  const updateTags = await messageRouter.sendCommand(
    'pageScript',
    'intercomAddTagsToCurrentConversation',
    { tagData }
  );

  if (isSuccess(updateTags)) {
    return success(
      updateTags.data.map((tag) => ({
        id: tag.id,
        label: tag.name,
      }))
    );
  } else {
    return failure({ message: updateTags.error });
  }
};

const applyTagsUsingConversationPart = async (
  messageRouter: KenchiMessageRouter<'app' | 'hud'>,
  data: { adminId: any; conversationPartId: any; tagIds: string[] }
) => {
  const resp = await messageRouter.sendCommand(
    'pageScript',
    'intercomApplyTags',
    data
  );
  if (resp.success) {
    return success(data.tagIds.map((t) => ({ id: t, label: t })));
  } else {
    return failure({ message: 'failed to apply tags' });
  }
};
export default addIntercomTags;
