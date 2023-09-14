import { useEffect, useMemo, useState } from 'react';

import isEqual from 'fast-deep-equal';

import { ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { isSlateEmpty, newSlateBlob } from '@kenchi/slate-tools/lib/utils';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import useCollections from '../../collection/useCollections';
import {
  BranchTypeEnum,
  ToolCreateInput,
  ToolFragment,
} from '../../graphql/generated';
import { useHasCollectionPermission } from '../../graphql/useSettings';
import { useShortcut } from '../../graphql/useShortcuts';
import { computeIsUploading } from './utils';

export enum SubmitMode {
  publish = 'publish',
  publishAndAlert = 'publishAndAlert',
  suggest = 'suggest',
  draft = 'draft',
}

export const branchTypeForSubmitMode = {
  publish: BranchTypeEnum.published,
  publishAndAlert: BranchTypeEnum.published,
  suggest: BranchTypeEnum.suggestion,
  draft: BranchTypeEnum.draft,
};

const startingContents: SlateNode[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

const startingGmailConfiguration = {
  data: {
    slate: true,
    singleLine: false,
    rich: true,
    children: [
      {
        children: [
          {
            text: '',
          },
        ],
      },
    ],
  },
};

export const useToolFormState = (
  tool?: ToolFragment | null,
  defaultCollectionId?: string,
  defaultComponent: 'GmailAction' | 'OpenURLs' = 'GmailAction',
  proposedSnippet?: SlateNode[]
) => {
  const nameState = useFormState<string>(tool?.name, '');
  const collectionIdState = useFormState<string>(
    tool?.collection?.id,
    defaultCollectionId || '',
    // Since the state starts out as an empty string and we "find" a value,
    // don't consider a transition involving a nullish value to be a change
    (a, b) => !a || !b || a === b
  );

  const componentState = useFormState<string>(
    proposedSnippet ? 'GmailAction' : tool?.component,
    defaultComponent
  );

  const inputsState = useFormState<ToolInput[]>(tool?.inputs, []);
  const configurationState = useFormState<any>(
    proposedSnippet
      ? {
          data: { ...newSlateBlob({ rich: true }), children: proposedSnippet },
        }
      : tool?.configuration,
    null,
    isEqual
  );
  const keywordsState = useFormState<string[]>(tool?.keywords, [], isEqual);
  const iconState = useFormState<string | null>(tool?.icon, null);
  const showChangeAlertState = useFormState<boolean>(
    tool
      ? tool.branchType !== BranchTypeEnum.published &&
          !!tool.majorChangeDescription
      : undefined,
    false
  );
  const changeDescriptionState = useFormState<SlateNode[]>(
    tool?.branchType !== BranchTypeEnum.published &&
      tool?.majorChangeDescription
      ? tool?.majorChangeDescription
      : undefined,
    startingContents,
    isEqual
  );

  const { userShortcut, orgShortcut } = useShortcut(tool?.staticId);
  const userShortcutState = useFormState<string>(userShortcut ?? undefined, '');
  const orgShortcutState = useFormState<string>(orgShortcut ?? undefined, '');

  const formStates = {
    changeDescriptionState,
    collectionIdState,
    componentState,
    configurationState,
    iconState,
    inputsState,
    keywordsState,
    nameState,
    orgShortcutState,
    showChangeAlertState,
    userShortcutState,
  };

  const hasChanges = Object.values(formStates).some(
    (state) => state.hasChanged
  );

  const resetAllFormStates = () => {
    Object.values(formStates).forEach((state) => state.reset());
  };

  const hasPublishPermission = useHasCollectionPermission(
    collectionIdState.value,
    'publish_tool'
  );

  const isSuggestion = tool?.branchType === BranchTypeEnum.suggestion;
  const isDraft = tool?.branchType === BranchTypeEnum.draft;

  const itemName = isSuggestion
    ? ('suggestion' as const)
    : ('snippet' as const);

  const branchByUser = tool?.branches.edges[0]?.node;

  const hasPendingSuggestion = Boolean(
    branchByUser && tool?.branchId !== branchByUser.branchId
  );

  const shouldShowPublish = Boolean(
    hasPublishPermission && !isSuggestion && !hasPendingSuggestion
  );

  const shouldShowSaveDraft = !tool || tool.branchType === BranchTypeEnum.draft;

  const initialSubmitMode = shouldShowPublish
    ? SubmitMode.publish
    : SubmitMode.suggest;

  const [submitMode, setSubmitMode] = useState<SubmitMode>(initialSubmitMode);

  useEffect(() => {
    setSubmitMode(shouldShowPublish ? SubmitMode.publish : SubmitMode.suggest);
  }, [shouldShowPublish]);

  const resetSubmitMode = () => setSubmitMode(initialSubmitMode);

  const branchType = branchTypeForSubmitMode[submitMode];

  const dataForSubmit = {
    branchType,
    icon: iconState.value,
    name: nameState.value,
    description: '',
    collectionId: collectionIdState.value,
    component: componentState.value,
    keywords: keywordsState.value,
    inputs: inputsState.value,
    configuration: configurationState.value,
    majorChangeDescription:
      // TODO: submitMode only gets set in DashboardViewAndEditTool, when the
      // customer changes the submit MultiButton selection and showChangeAlertState
      // only gets set in the other edit UIs. Eventually all editing UIs should
      // use submitMode and the MultiButton. Then we can drop showChangeAlertState here.
      (submitMode === SubmitMode.publishAndAlert ||
        showChangeAlertState.value) &&
      !changeDescriptionState.value.every(isSlateEmpty)
        ? changeDescriptionState.value
        : null,
  };

  // For now we always validate as ToolCreateInput, even when updating
  // (instead of as ToolUpdateInput). We don't currently have a UI for updating
  // a tool that contains fewer fields than creating a tool does.
  const validate = (data: ToolCreateInput) => {
    if (!data.name) {
      return 'Please give your snippet a name.';
    }
    if (
      !data.configuration ||
      isEqual(data.configuration, startingGmailConfiguration)
    ) {
      return 'Please give your snippet some content.';
    }
  };

  const { collections } = useCollections('cache-first');
  const selectedCollection = collections?.find(
    (c) => c.id === collectionIdState.value
  );

  const isUploading = useMemo(() => {
    return (
      componentState.value === 'GmailAction' &&
      configurationState.value?.data &&
      computeIsUploading(configurationState.value.data.children)
    );
  }, [componentState.value, configurationState.value]);

  return {
    ...formStates,
    hasChanges,
    isDraft,
    isUploading,
    isSuggestion,
    resetAllFormStates,
    shouldShowPublish,
    shouldShowSaveDraft,
    itemName,
    branchByUser,
    hasPendingSuggestion,
    submitMode,
    setSubmitMode,
    resetSubmitMode,
    dataForSubmit,
    validationErrorMessage: validate(dataForSubmit),
    selectedCollection,
  };
};
