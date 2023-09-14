import { css } from '@emotion/react';
import tw from 'twin.macro';

import { PrimaryButton, SecondaryButton } from '@kenchi/ui/lib/Button';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import {
  BranchTypeEnum,
  ToolFragment,
  WorkflowFragment,
} from '../graphql/generated';

export type EditType = 'normal' | 'publishOnly' | 'suggestOnly';

export type SuggestionButtonText =
  | 'Suggest Edit'
  | 'Update Suggestion'
  | 'Submit for Review';

export const suggestionButtonText = (branchType: BranchTypeEnum | null) => {
  switch (branchType) {
    case BranchTypeEnum.published:
      return 'Suggest Edit';
    case BranchTypeEnum.suggestion:
      return 'Update Suggestion';
    default:
      return 'Submit for Review';
  }
};

type EditorContext = {
  canPublish: boolean | null;
  doSubmit: (branchType: BranchTypeEnum) => void;
  editingObject: ToolFragment | WorkflowFragment | null | undefined;
  editType: EditType;
  formDisabled: boolean;
  hasChanges: boolean;
  isUploading: boolean;
  onBack: () => void;
  submitLoading: boolean;
};

export const getEditActionBarProps = ({
  canPublish,
  doSubmit,
  editType,
  formDisabled,
  hasChanges,
  isUploading,
  onBack,
  submitLoading,
  editingObject,
}: EditorContext): EditActionBarProps => {
  const allButtonsDisabled = formDisabled || isUploading || submitLoading;
  const branchType = editingObject?.branchType || null;
  const isNewDraft = !branchType;
  const isDraft = branchType === BranchTypeEnum.draft;
  const isSuggestion = branchType === BranchTypeEnum.suggestion;
  const shouldShowPublish =
    editType === 'publishOnly' ||
    (!!canPublish && !isSuggestion && editType !== 'suggestOnly');
  const shouldShowSaveDraft =
    editType !== 'publishOnly' && (isNewDraft || isDraft);
  const shouldShowSuggest = editType !== 'publishOnly';

  return {
    allButtonsDisabled,
    onBack,
    onSubmit: doSubmit,
    saveDraftEnabled: hasChanges && !allButtonsDisabled,
    shouldShowDraftButtonTooltip: isNewDraft,
    shouldShowPublish,
    shouldShowSaveDraft,
    shouldShowSuggest,
    shouldShowUploadingToolTip: isUploading,
    suggestionButtonText: suggestionButtonText(branchType),
    suggestIsPrimary: !shouldShowPublish || isSuggestion,
  };
};

type EditActionBarProps = {
  allButtonsDisabled: boolean;
  onBack: () => void;
  onSubmit: (branchType: BranchTypeEnum) => void;
  saveDraftEnabled: boolean;
  shouldShowDraftButtonTooltip: boolean;
  shouldShowPublish: boolean;
  shouldShowSaveDraft: boolean;
  shouldShowSuggest: boolean;
  shouldShowUploadingToolTip: boolean;
  suggestionButtonText: SuggestionButtonText;
  suggestIsPrimary: boolean;
};

export default function EditActionBar({
  allButtonsDisabled,
  onBack,
  onSubmit,
  saveDraftEnabled,
  shouldShowDraftButtonTooltip,
  shouldShowPublish,
  shouldShowSaveDraft,
  shouldShowSuggest,
  shouldShowUploadingToolTip,
  suggestionButtonText,
  suggestIsPrimary,
}: EditActionBarProps) {
  const buttons = [
    <SecondaryButton
      key="cancel"
      type="button"
      onClick={onBack}
      disabled={allButtonsDisabled}
    >
      Cancel
    </SecondaryButton>,
  ];

  if (shouldShowSaveDraft) {
    const saveDraftButton = (
      <SecondaryButton
        key="draft"
        onClick={() => onSubmit(BranchTypeEnum.draft)}
        disabled={!saveDraftEnabled}
      >
        Save Draft
      </SecondaryButton>
    );
    if (shouldShowDraftButtonTooltip) {
      buttons.push(
        <Tooltip
          key="draft"
          placement="top"
          overlay="Work in progress? Save a draft to keep this playbook private to you, then publish when ready to share."
        >
          {saveDraftButton}
        </Tooltip>
      );
    } else {
      buttons.push(saveDraftButton);
    }
  }

  if (shouldShowSuggest) {
    const SuggestButtonElem = suggestIsPrimary
      ? PrimaryButton
      : SecondaryButton;
    buttons.push(
      <Tooltip
        key="suggest"
        placement="top"
        overlay="Suggest a change for your team publishers to review."
      >
        <SuggestButtonElem
          onClick={() => onSubmit(BranchTypeEnum.suggestion)}
          disabled={allButtonsDisabled}
        >
          {suggestionButtonText}
        </SuggestButtonElem>
      </Tooltip>
    );
  }

  // If user doesn't have publish permissions and this is publishOnly we'll
  // still show the button, which will error. Practically we only use
  // publishOnly when we already have checked permissions, but we don't enforce
  // that well.
  if (shouldShowPublish) {
    buttons.push(
      <PrimaryButton
        key="publish"
        onClick={() => onSubmit(BranchTypeEnum.published)}
        disabled={allButtonsDisabled}
      >
        Publish
      </PrimaryButton>
    );
  }

  const styleActionStack = css`
    ${tw`gap-2 grid place-content-stretch`}
  `;

  if (shouldShowUploadingToolTip) {
    return (
      <Tooltip
        mouseEnterDelay={0}
        overlay="Waiting for images to finish uploading"
      >
        <div css={styleActionStack}>{buttons.reverse()}</div>
      </Tooltip>
    );
  } else {
    return <div css={styleActionStack}>{buttons.reverse()}</div>;
  }
}
