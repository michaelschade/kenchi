import { ReactNode, useEffect, useReducer, useState } from 'react';

import { MutationResult } from '@apollo/client';
import { css } from '@emotion/react';
import {
  faEdit,
  faFileInvoice,
  faMailBulk,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import { useHistory } from 'react-router-dom';

import Alert from '@kenchi/ui/lib/Alert';
import { SecondaryButton } from '@kenchi/ui/lib/Button';
import { BaseColors } from '@kenchi/ui/lib/Colors';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { LoadingBar } from '@kenchi/ui/lib/Dashboard/LoadingBar';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import {
  AutoResizeInput,
  CollectionSelectorButtonContents,
  delayForHideEditActionBarMs,
  EditActionBarContainer,
  ErrorsAndAlerts,
  Heading,
  InlineAutosizeTextarea,
  MainConfiguration,
  Sidebar,
  ViewAndEditPageGrid,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import {
  DateRangeGrouping,
  DateRangePicker,
  DateRangePreset,
  dateRangePresets,
} from '@kenchi/ui/lib/DateRangePicker';
import { InlineEmojiPicker } from '@kenchi/ui/lib/EmojiPicker';
import { FormGroup } from '@kenchi/ui/lib/Form';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import CollectionSelector from '../collection/CollectionSelector';
import { BranchStatusAlert, DraftAlert } from '../components/BranchStatus';
import ConfirmPageUnload from '../components/ConfirmPageUnload';
import { suggestionButtonText } from '../components/EditActionBar';
import { EditorMultiSubmitButton } from '../components/EditorMultiSubmitButton';
import ErrorAlert from '../components/ErrorAlert';
import RecoveryAlert from '../components/RecoveryAlert';
import { VersionedNodeArchivedNotice } from '../components/VersionedNodeArchivedNotice';
import { ExistingSuggestionAlert } from '../components/VersionedNodeModifyContainer';
import { errorFromMutation } from '../graphql/errorFromMutation';
import {
  BranchTypeEnum,
  DeleteWorkflowMutation,
  WorkflowCreateInput,
  WorkflowFragment,
} from '../graphql/generated';
import { useHasIntercom } from '../graphql/useSettings';
import { CSATCommentsCard } from '../insights/CSATCommentsCard';
import { Suggestions } from '../insights/Suggestions';
import { TopUsers } from '../insights/TopUsers';
import { UsageCard } from '../insights/UsageCard';
import { useSuggestions } from '../insights/useSuggestions';
import { RecoveryEditor, useRecovery } from '../slate/Editor/Recovery';
import { ChangeDescriptionEditor } from '../tool/ChangeDescriptionEditor';
import { ResultForCreateOrModify } from '../tool/edit/DashboardToolEditor';
import {
  SearchKeywords,
  searchKeywordsDescription,
} from '../tool/edit/SearchKeywords';
import { SubmitMode } from '../tool/edit/useToolFormState';
import { VersionedNodeHistory } from '../tool/edit/VersionedNodeHistory';
import { trackEvent } from '../utils/analytics';
import useConfirm from '../utils/useConfirm';
import { useSimpleQueryParams } from '../utils/useQueryParams';
import { DashboardWorkflowPageMenu } from './DashboardWorkflowPageMenu';
import { useWorkflowFormState } from './useWorkflowFormState';
import { validateWorkflow } from './WorkflowEditor';

type DashboardWorkflowEditorProps = {
  workflow?: WorkflowFragment | null;
  shouldConfirmUnloadIfChanged: boolean;
  submitButtonLabelOverride: ReactNode;
  deleteWorkflowResult?: MutationResult<DeleteWorkflowMutation>;
  resultForCreateOrModify: ResultForCreateOrModify;
  createOrModifyWorkflow: (workflowData: WorkflowCreateInput) => void;
  shouldShowSuccessMessage: boolean;
  onCancel: () => void;
  onClickDelete?: () => void;
  defaultCollectionId?: string;
  workflowIsLoading?: boolean;
};

const DashboardWorkflowEditor = ({
  workflow,
  shouldConfirmUnloadIfChanged,
  submitButtonLabelOverride,
  deleteWorkflowResult,
  resultForCreateOrModify,
  createOrModifyWorkflow,
  shouldShowSuccessMessage,
  onCancel,
  onClickDelete,
  defaultCollectionId,
  workflowIsLoading = false,
}: DashboardWorkflowEditorProps) => {
  const onSubmit = () => {
    if (isUploading || !collectionIdState.value) {
      return;
    }

    const validationErrorMessage = validateWorkflow(dataForSubmit);
    if (validationErrorMessage) {
      setFormValidationMessage(validationErrorMessage);
      return;
    }
    createOrModifyWorkflow(dataForSubmit);
  };

  const {
    nameState,
    descriptionState,
    collectionIdState,
    contentsState,
    iconState,
    keywordsState,
    changeDescriptionState,
    selectedCollection,
    resetAllFormStates,
    resetSubmitMode,
    setSubmitMode,
    isDraft,
    isSuggestion,
    submitMode,
    shouldShowPublish,
    dataForSubmit,
    itemName,
    shouldShowSaveDraft,
    isUploading,
    hasChanges,
  } = useWorkflowFormState(workflow, defaultCollectionId);

  useEffect(() => {
    // Update the editor to reflect the contentsState if the editor hasn't been
    // edited. We only want to do this when we get a new workflow from Apollo.
    // If we don't do this, it's possible for an old cached version of the
    // contentsState from another tab to be returned from Apollo cache on load.
    // Then, even though the latest (correct) contentsState gets fetched over
    // the network right afterwards, Slate won't update to show it. This forces
    // Slate to update.
    if (!contentsState.hasChanged && workflow) {
      incrementEditorKey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow]);

  const { hasRecovery } = useRecovery();
  const history = useHistory();
  const { suggestions } = useSuggestions(workflow?.staticId);
  const hasIntercom = useHasIntercom();
  const [confirm, ConfirmPrompt] = useConfirm();

  const [editorKey, incrementEditorKey] = useReducer(
    (current) => current + 1,
    0
  );

  const [discarding, setDiscarding] = useState(false);

  const [formValidationMessage, setFormValidationMessage] = useState<
    string | null
  >(null);

  const hasErrorsOrAlerts =
    hasRecovery ||
    formValidationMessage ||
    isDraft ||
    isSuggestion ||
    workflow?.isArchived ||
    (deleteWorkflowResult && errorFromMutation(deleteWorkflowResult)) ||
    resultForCreateOrModify.error;

  const [
    {
      start: startFromQueryParams,
      end: endFromQueryParams,
      grouping: groupingFromQueryParams,
    },
    setQueryParams,
  ] = useSimpleQueryParams();

  const defaultStartDate = dateRangePresets.pastThirtyDays.start();
  const defaultEndDate = dateRangePresets.pastThirtyDays.end();
  const defaultChartGrouping = DateRangeGrouping.week;

  const startDate = startFromQueryParams
    ? DateTime.fromISO(startFromQueryParams)
    : defaultStartDate;
  const endDate = endFromQueryParams
    ? DateTime.fromISO(endFromQueryParams)
    : defaultEndDate;
  const dateGrouping = (groupingFromQueryParams ||
    defaultChartGrouping) as Exclude<
    DateRangeGrouping,
    DateRangeGrouping.overall
  >;

  const onChangeDates = (
    start: DateTime,
    end: DateTime,
    preset: DateRangePreset | 'custom'
  ) => {
    trackEvent({
      category: 'dashboard_playbook',
      action: 'change_dates',
      label: 'Change dates for insights',
      start: start.toISODate(),
      end: end.toISODate(),
      preset,
      grouping: dateGrouping,
    });
    setQueryParams(
      {
        start: start.toISODate(),
        end: end.toISODate(),
      },
      { shouldReplaceState: true }
    );
  };

  const onChangeGrouping = (grouping: DateRangeGrouping) => {
    trackEvent({
      category: 'dashboard_playbook',
      action: 'change_grouping',
      label: 'Change grouping for insights',
      start: startDate.toISODate(),
      end: endDate.toISODate(),
      grouping,
    });
    setQueryParams({ grouping }, { shouldReplaceState: true });
  };

  const cancelButtonText = workflow ? 'Discard Changes' : 'Delete Draft';
  const confirmPromptText = workflow ? (
    <span>
      Are you sure you want to discard changes to{' '}
      <span
        css={css`
          font-style: italic;
        `}
      >
        {workflow.name}
      </span>
      ?
    </span>
  ) : (
    'Are you sure you want to delete this draft?'
  );

  const textForConfirmButton = workflow ? 'Discard Changes' : 'Delete Draft';

  const actionBarButtons = [
    <SecondaryButton
      key="cancel"
      css={css`
        min-width: 8rem;
      `}
      type="button"
      onClick={async () => {
        if (
          !hasChanges ||
          (await confirm(confirmPromptText, {
            textForConfirmButton,
            dangerous: true,
          }))
        ) {
          resetAllFormStates();
          setTimeout(() => {
            resetSubmitMode();
          }, delayForHideEditActionBarMs);
          incrementEditorKey();
          if (!workflow) {
            setDiscarding(true);
          }
          onCancel();
        }
      }}
      disabled={
        workflow?.isArchived ||
        isUploading ||
        resultForCreateOrModify.loading ||
        (isDraft && !hasChanges)
      }
    >
      {cancelButtonText}
    </SecondaryButton>,
    <div key="submit">
      <ChangeDescriptionEditor
        isOpen={
          submitMode === SubmitMode.publishAndAlert && (hasChanges || isDraft)
        }
        value={changeDescriptionState.value}
        onChange={changeDescriptionState.set}
        helpText="Keep your team on the same page by describing major changes to your playbooks. Notifications are especially helpful for important process changes, bugs, and incidents."
      />
      <EditorMultiSubmitButton
        disabled={
          isUploading ||
          resultForCreateOrModify.loading ||
          !!workflow?.isArchived
        }
        labelOverride={submitButtonLabelOverride}
        onChangeSubmitMode={setSubmitMode}
        submitMode={submitMode}
        onSubmit={onSubmit}
        shouldShowPublish={shouldShowPublish}
        shouldShowSaveDraft={shouldShowSaveDraft}
        shouldDisablePublishAndAlert={!changeDescriptionState.hasChanged}
        labelForSuggest={suggestionButtonText(workflow?.branchType || null)}
      />
    </div>,
  ];

  const editActionBar = (
    <EditActionBarContainer
      visible={
        (!workflow || hasChanges || isDraft || shouldShowSuccessMessage) &&
        !workflow?.isArchived
      }
    >
      {actionBarButtons}
    </EditActionBarContainer>
  );

  return (
    <>
      <LoadingBar isLoading={workflowIsLoading} />
      <ConfirmPrompt />
      {shouldConfirmUnloadIfChanged && hasChanges && !discarding && (
        <ConfirmPageUnload />
      )}
      <PageContainer
        width="lg"
        meta={{
          title: workflow ? `Playbook: ${workflow.name}` : 'New Playbook',
        }}
        editableIcon={
          <InlineEmojiPicker
            fallbackIcon={faMailBulk}
            initialEmoji={iconState.value || ''}
            onSelect={iconState.set}
          />
        }
        fallbackIcon={faFileInvoice}
        heading={
          <Heading>
            <AutoResizeInput
              placeholder={workflow ? 'Playbook name' : 'New playbook name'}
              autoFocus={!workflow}
              value={nameState.value}
              onChange={(event) => nameState.set(event.target.value)}
            />
            <CollectionSelector
              selectedCollection={workflow?.collection}
              value={collectionIdState.value}
              onChange={collectionIdState.set}
              label=""
              button={
                <CollectionSelectorButtonContents
                  name={selectedCollection?.name || ''}
                  icon={selectedCollection?.icon}
                />
              }
            />
          </Heading>
        }
        subheading={
          <div
            css={css`
              display: grid;
            `}
          >
            <InlineAutosizeTextarea
              value={descriptionState.value}
              placeholder="Playbook description"
              onChange={(e) => {
                const descriptionValue = e.target.value.replace('\n', '');
                descriptionState.set(descriptionValue);
              }}
              disabled={workflow?.isArchived}
              css={css`
                margin-top: 0.5rem;
              `}
            />
          </div>
        }
        actions={
          onClickDelete &&
          !workflow?.isArchived && (
            <DashboardWorkflowPageMenu onClickDelete={onClickDelete} />
          )
        }
      >
        <ViewAndEditPageGrid>
          <MainConfiguration>
            {hasErrorsOrAlerts && (
              <ErrorsAndAlerts>
                {workflow && isDraft && !workflow.isArchived && (
                  <DraftAlert itemName={itemName} />
                )}
                {workflow && isSuggestion && !workflow.isArchived && (
                  <ExistingSuggestionAlert createdAt={workflow.createdAt} />
                )}
                {workflow?.isArchived && isSuggestion && (
                  <BranchStatusAlert
                    item={workflow}
                    additionalText="You can no longer edit this version. Click here to view the latest and make any new changes."
                    onClick={() =>
                      history.push(`/dashboard/playbooks/${workflow.staticId}`)
                    }
                  />
                )}
                {workflow && (
                  <VersionedNodeArchivedNotice
                    type="playbook"
                    node={workflow}
                  />
                )}
                {!workflow?.isArchived && <RecoveryAlert itemType="workflow" />}
                {deleteWorkflowResult && (
                  <ErrorAlert
                    title={`Error deleting ${itemName}`}
                    error={errorFromMutation(deleteWorkflowResult)}
                  />
                )}
                {formValidationMessage && (
                  <Alert
                    description={formValidationMessage}
                    icon={
                      <FontAwesomeIcon
                        icon={faEdit}
                        css={css`
                          font-size: 0.8rem;
                        `}
                      />
                    }
                    onDismiss={() => setFormValidationMessage(null)}
                    primaryColor={BaseColors.error}
                    title="Some information is missing"
                  />
                )}
                {resultForCreateOrModify.error && (
                  <ErrorAlert
                    title={`Error ${
                      workflow ? 'updating' : 'creating'
                    } ${itemName}`}
                    error={resultForCreateOrModify.error}
                  />
                )}
              </ErrorsAndAlerts>
            )}
            <ContentCard fullBleed>
              <FormGroup>
                <RecoveryEditor
                  key={editorKey}
                  recoveryKey="workflow"
                  style={{ minHeight: '250px' }}
                  spellCheck
                  withFormatting
                  withKenchiElements={{
                    defaultCollectionId: collectionIdState.value || undefined,
                  }}
                  withImages
                  withWorkflowLinks
                  withURLLinks
                  withCollapsible
                  size="large"
                  value={contentsState.value}
                  onChange={contentsState.set}
                  disabled={workflow?.isArchived}
                />
              </FormGroup>
            </ContentCard>
          </MainConfiguration>
          <Sidebar>
            <ContentCard
              fullBleed
              title={
                <>
                  Search keywords
                  <HelpIcon
                    placement="top"
                    content={searchKeywordsDescription}
                  />
                </>
              }
            >
              <SearchKeywords
                disabled={!!workflow?.isArchived}
                values={keywordsState.value}
                onChange={keywordsState.set}
              />
            </ContentCard>
            {workflow && (
              <>
                {suggestions.length > 0 && (
                  <Suggestions versionedNode={workflow} />
                )}
                <Separator />
                <div
                  css={css`
                    display: grid;
                  `}
                >
                  <DateRangePicker
                    onChangeDates={onChangeDates}
                    onChangeGrouping={onChangeGrouping}
                    selectedEnd={endDate}
                    selectedGrouping={dateGrouping}
                    selectedStart={startDate}
                  />
                </div>
                {hasIntercom && (
                  <CSATCommentsCard
                    versionedNode={workflow}
                    startDate={startDate}
                    endDate={endDate}
                  />
                )}
                <UsageCard
                  versionedNode={workflow}
                  startDate={startDate}
                  endDate={endDate}
                  dateGrouping={dateGrouping}
                />
                <TopUsers
                  versionedNode={workflow}
                  startDate={startDate}
                  endDate={endDate}
                />
                {workflow.branchType === BranchTypeEnum.published && (
                  <>
                    <Separator />
                    <VersionedNodeHistory versionedNode={workflow} />
                  </>
                )}
              </>
            )}
          </Sidebar>
        </ViewAndEditPageGrid>
        {isUploading ? (
          <Tooltip
            mouseEnterDelay={0}
            overlay="Waiting for images to finish uploading"
          >
            {editActionBar}
          </Tooltip>
        ) : (
          editActionBar
        )}
      </PageContainer>
    </>
  );
};

export default DashboardWorkflowEditor;
