import { ReactNode } from 'react';

import styled from '@emotion/styled';

import { ButtonConfigs, MultiButton } from '@kenchi/ui/lib/MultiButton';

import { SubmitMode } from '../tool/edit/useToolFormState';

const StyledMultiButton = styled(MultiButton)`
  // To avoid resizing as the label changes
  min-width: 12rem;
`;

type EditorMultiSubmitButtonProps = {
  disabled: boolean;
  labelForSuggest: string;
  labelOverride?: ReactNode;
  onChangeSubmitMode: (submitMode: SubmitMode) => void;
  onSubmit: () => void;
  shouldDisablePublishAndAlert: boolean;
  shouldShowPublish: boolean;
  shouldShowSaveDraft: boolean;
  submitMode: SubmitMode;
};

export const EditorMultiSubmitButton = ({
  disabled,
  labelForSuggest,
  labelOverride,
  onChangeSubmitMode,
  onSubmit,
  shouldDisablePublishAndAlert,
  shouldShowPublish,
  shouldShowSaveDraft,
  submitMode,
}: EditorMultiSubmitButtonProps) => {
  const submitButtonConfigs: ButtonConfigs = {};

  if (shouldShowPublish) {
    submitButtonConfigs.publish = {
      label: 'Publish',
      onClick: onSubmit,
    };

    submitButtonConfigs.publishAndAlert = {
      label: 'Publish and Alert',
      onClick: onSubmit,
      disabled: shouldDisablePublishAndAlert,
    };
  }

  if (shouldShowSaveDraft) {
    submitButtonConfigs.draft = {
      label: 'Save Draft',
      onClick: onSubmit,
    };
  }

  submitButtonConfigs.suggest = {
    label: labelForSuggest,
    onClick: onSubmit,
    description: 'Suggest a change for your team publishers to review.',
  };

  return (
    <StyledMultiButton
      buttonConfigs={submitButtonConfigs}
      disabled={disabled}
      key="publish_with_alert"
      labelOverride={labelOverride}
      onChangeSelectedButtonKey={(key) => onChangeSubmitMode(key as SubmitMode)}
      selectedButtonKey={submitMode}
    />
  );
};
