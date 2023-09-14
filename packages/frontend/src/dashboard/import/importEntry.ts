import { mapValues } from 'lodash';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';

import { isFailure } from '@kenchi/shared/lib/Result';
import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { extractVariablesFromSlate } from '@kenchi/slate-tools/lib/utils';

import { getClient } from '../../graphql/client';
import {
  BranchTypeEnum,
  CreateToolMutation,
  CreateToolMutationVariables,
  SetShortcutsMutation,
  SetShortcutsMutationVariables,
} from '../../graphql/generated';
import { ImportEntry } from '../../importers';
import { MUTATION as SET_SHORTCUTS } from '../../shortcuts/useSetShortcuts';
import { uploadImageFromURL } from '../../slate/Editor/withImages';
import { CREATE_TOOL } from '../../tool/edit/useCreateTool';

const replaceImageSrc = (
  slate: SlateNode[],
  origUrl: string,
  newUrl: string
) => {
  let replacedCount = 0;
  slate.forEach((node) => {
    if (node.type === 'image' && node.url === origUrl) {
      node.url = newUrl;
      delete node.uploading;
      replacedCount++;
    } else if (node.children) {
      replacedCount += replaceImageSrc(node.children, origUrl, newUrl);
    }
  });
  return replacedCount;
};

export const importEntry = async (
  entry: ImportEntry,
  collectionId: string,
  canManageOrgShortcuts: boolean
) => {
  const {
    slate,
    zendeskTags,
    zendeskAssign,
    zendeskSetTicketStatus,
    intercomTags,
  } = entry;

  const hasFailure =
    isFailure(slate) ||
    (zendeskTags && isFailure(zendeskTags)) ||
    (zendeskAssign && isFailure(zendeskAssign)) ||
    (zendeskSetTicketStatus && isFailure(zendeskSetTicketStatus)) ||
    (intercomTags && isFailure(intercomTags));
  if (hasFailure) {
    throw new Error('Entry could not be imported due to parse error');
  }

  const client = getClient();

  const extractImageUrls = (node: SlateNode): string[] => {
    if (node.type === 'image') {
      return [node.url];
    } else if (node.children) {
      return flatMap(node.children, extractImageUrls);
    }
    return [];
  };

  const imageUrls = uniq(flatMap(slate.data, extractImageUrls));

  await Promise.all(
    imageUrls.map(async (url) => {
      const newUrl = await uploadImageFromURL(url, client);
      if (isFailure(newUrl)) {
        // TODO: image upload error
        return;
      }

      replaceImageSrc(slate.data, url, newUrl.data);
    })
  );

  // Extract data from the Result values
  const nonSlateData = mapValues(
    {
      zendeskTags,
      zendeskAssign,
      zendeskSetTicketStatus,
      intercomTags,
    },
    'data'
  );
  const createResult = await client.mutate<
    CreateToolMutation,
    CreateToolMutationVariables
  >({
    mutation: CREATE_TOOL,
    variables: {
      toolData: {
        branchType: BranchTypeEnum.published,
        component: 'GmailAction',
        collectionId,
        description: '',
        name: entry.name,
        inputs: extractVariablesFromSlate(slate.data),
        configuration: {
          data: {
            slate: true,
            singleLine: false,
            rich: true,
            children: slate.data,
          },
          ...nonSlateData,
        },
        keywords: [],
      },
    },
  });

  if (createResult.errors) {
    console.error(createResult.errors);
    throw new Error('Entry could not be imported due to GraphQL error');
  }
  if (createResult.data?.modify.error) {
    console.error(createResult.data.modify.error);
    throw new Error('Entry could not be imported due to backend error');
  }
  const tool = createResult.data?.modify.tool;
  if (!tool) {
    throw new Error('Backend did not return imported entry');
  }

  if (canManageOrgShortcuts && entry.shortcut) {
    await client.mutate<SetShortcutsMutation, SetShortcutsMutationVariables>({
      mutation: SET_SHORTCUTS,
      variables: {
        staticId: tool.staticId,
        orgShortcut: entry.shortcut,
      },
    });
    // fails silently since this is a nice-to-have
  }

  return tool;
};
