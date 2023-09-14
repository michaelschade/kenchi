import { useEffect, useMemo, useState } from 'react';

import isEqual from 'fast-deep-equal';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { isSlateEmpty } from '@kenchi/slate-tools/lib/utils';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import useCollections from '../collection/useCollections';
import {
  BranchTypeEnum,
  WorkflowCreateInput,
  WorkflowFragment,
} from '../graphql/generated';
import { useHasCollectionPermission } from '../graphql/useSettings';
import {
  branchTypeForSubmitMode,
  SubmitMode,
} from '../tool/edit/useToolFormState';
import { computeIsUploading } from '../tool/edit/utils';
import { migrateContents, startingContents } from './WorkflowEditor';

export const useWorkflowFormState = (
  workflow?: WorkflowFragment | null,
  defaultCollectionId?: string
) => {
  const nameState = useFormState<string>(workflow?.name, '');
  const descriptionState = useFormState<string>(workflow?.description, '');
  const collectionIdState = useFormState<string>(
    workflow?.collection?.id,
    defaultCollectionId || '',
    // Since the state starts out as an empty string and we "find" a value,
    // don't consider a transition involving a nullish value to be a change
    (a, b) => !a || !b || a === b
  );
  const contentsState = useFormState<SlateNode[]>(
    workflow?.contents ? migrateContents(workflow.contents) : undefined,
    startingContents,
    isEqual
  );
  const iconState = useFormState<string | null>(workflow?.icon, null);
  const keywordsState = useFormState<string[]>(workflow?.keywords, [], isEqual);

  const showChangeAlertState = useFormState<boolean>(
    workflow
      ? workflow.branchType !== BranchTypeEnum.published &&
          !!workflow.majorChangeDescription
      : undefined,
    false
  );
  const changeDescriptionState = useFormState<SlateNode[]>(
    workflow?.branchType !== BranchTypeEnum.published &&
      workflow?.majorChangeDescription
      ? workflow?.majorChangeDescription
      : undefined,
    startingContents,
    isEqual
  );

  const { collections } = useCollections('cache-first');
  const selectedCollection = collections?.find(
    (c) => c.id === collectionIdState.value
  );

  const branchByUser = workflow?.branches.edges[0]?.node;

  const hasPendingSuggestion = Boolean(
    branchByUser && workflow?.branchId !== branchByUser.branchId
  );

  const hasPublishPermission = useHasCollectionPermission(
    collectionIdState.value,
    'publish_workflow'
  );

  const isSuggestion = workflow?.branchType === BranchTypeEnum.suggestion;
  const isDraft = workflow?.branchType === BranchTypeEnum.draft;
  const itemName = isSuggestion
    ? ('suggestion' as const)
    : ('playbook' as const);

  const shouldShowPublish = Boolean(
    hasPublishPermission && !isSuggestion && !hasPendingSuggestion
  );

  const shouldShowSaveDraft =
    !workflow || workflow.branchType === BranchTypeEnum.draft;

  const initialSubmitMode = shouldShowPublish
    ? SubmitMode.publish
    : SubmitMode.suggest;

  const [submitMode, setSubmitMode] = useState<SubmitMode>(initialSubmitMode);

  useEffect(() => {
    setSubmitMode(shouldShowPublish ? SubmitMode.publish : SubmitMode.suggest);
  }, [shouldShowPublish]);

  const resetSubmitMode = () => setSubmitMode(initialSubmitMode);

  const isUploading = useMemo(
    () => contentsState.value && computeIsUploading(contentsState.value),
    [contentsState.value]
  );

  const hasChanges =
    nameState.hasChanged ||
    descriptionState.hasChanged ||
    collectionIdState.hasChanged ||
    contentsState.hasChanged ||
    iconState.hasChanged ||
    keywordsState.hasChanged;

  const formStates = {
    nameState,
    descriptionState,
    collectionIdState,
    contentsState,
    iconState,
    keywordsState,
    showChangeAlertState,
    changeDescriptionState,
  };

  const branchType = branchTypeForSubmitMode[submitMode];

  const dataForSubmit: WorkflowCreateInput = {
    branchType,
    icon: iconState.value,
    name: nameState.value,
    keywords: keywordsState.value,
    description: descriptionState.value,
    collectionId: collectionIdState.value,
    contents: contentsState.value,
    majorChangeDescription:
      showChangeAlertState.value &&
      !changeDescriptionState.value.every(isSlateEmpty)
        ? changeDescriptionState.value
        : null,
  };

  const resetAllFormStates = () => {
    Object.values(formStates).forEach((state) => state.reset());
  };

  return {
    ...formStates,
    isDraft,
    resetAllFormStates,
    resetSubmitMode,
    setSubmitMode,
    selectedCollection,
    shouldShowSaveDraft,
    submitMode,
    isSuggestion,
    itemName,
    shouldShowPublish,
    dataForSubmit,
    isUploading,
    hasPendingSuggestion,
    branchByUser,
    hasChanges,
  };
};
