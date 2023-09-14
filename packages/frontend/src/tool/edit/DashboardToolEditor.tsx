import { ReactNode, useEffect, useReducer, useState } from 'react';

import { ApolloError, MutationResult } from '@apollo/client';
import { css } from '@emotion/react';
import { faEdit, faMailBulk } from '@fortawesome/pro-solid-svg-icons';
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
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import CollectionSelector from '../../collection/CollectionSelector';
import { BranchStatusAlert, DraftAlert } from '../../components/BranchStatus';
import ConfirmPageUnload from '../../components/ConfirmPageUnload';
import { suggestionButtonText } from '../../components/EditActionBar';
import { EditorMultiSubmitButton } from '../../components/EditorMultiSubmitButton';
import ErrorAlert from '../../components/ErrorAlert';
import RecoveryAlert from '../../components/RecoveryAlert';
import { VersionedNodeArchivedNotice } from '../../components/VersionedNodeArchivedNotice';
import { ExistingSuggestionAlert } from '../../components/VersionedNodeModifyContainer';
import { errorFromMutation } from '../../graphql/errorFromMutation';
import {
  BranchTypeEnum,
  DeleteToolMutation,
  KenchiErrorFragment,
  ToolCreateInput,
  ToolFragment,
} from '../../graphql/generated';
import { useHasIntercom, useHasOrgPermission } from '../../graphql/useSettings';
import { CSATCommentsCard } from '../../insights/CSATCommentsCard';
import { RelatedWorkflows } from '../../insights/RelatedWorkflows';
import { Suggestions } from '../../insights/Suggestions';
import { TopUsers } from '../../insights/TopUsers';
import { UsageCard } from '../../insights/UsageCard';
import { useSuggestions } from '../../insights/useSuggestions';
import { useRecovery } from '../../slate/Editor/Recovery';
import { trackEvent } from '../../utils/analytics';
import useConfirm from '../../utils/useConfirm';
import { useSimpleQueryParams } from '../../utils/useQueryParams';
import { ChangeDescriptionEditor } from '../ChangeDescriptionEditor';
import { DashboardToolPageMenu } from '../DashboardToolPageMenu';
import { ActionsHelpIcon } from './AppActions/ActionsHelpIcon';
import { AppActionsAccordion } from './AppActions/AppActionsAccordion';
import ComponentConfigurationEditor from './ComponentConfigurationEditor';
import { SearchKeywords, searchKeywordsDescription } from './SearchKeywords';
import {
  shortcutsDescription,
  ShortcutsInputGroup,
} from './ShortcutsInputGroup';
import { SubmitMode, useToolFormState } from './useToolFormState';
import { VersionedNodeHistory } from './VersionedNodeHistory';

export type ResultForCreateOrModify = {
  loading: boolean;
  error: ApolloError | KenchiErrorFragment | null | undefined;
};

type CreateOrModifyTool = (
  // We always use ToolCreateInput, rather than ToolUpdateInput, because
  // this editor submits all the data needed for create, even if just updating.
  toolData: ToolCreateInput,
  orgShortcut?: string | null,
  userShortcut?: string | null
) => Promise<void>;

type DashboardToolEditorProps = {
  createOrModifyTool: CreateOrModifyTool;
  defaultCollectionId?: string;
  onCancel: () => void;
  onClickDelete?: () => void;
  resultForCreateOrModify: ResultForCreateOrModify;
  shouldConfirmUnloadIfChanged: boolean;
  shouldShowSuccessMessage: boolean;
  submitButtonLabelOverride: ReactNode;
  tool?: ToolFragment | null;
  deleteToolResult?: MutationResult<DeleteToolMutation>;
  hasLatestData?: boolean;
};

const DashboardToolEditor = ({
  createOrModifyTool,
  defaultCollectionId,
  deleteToolResult,
  onCancel,
  onClickDelete,
  resultForCreateOrModify,
  shouldConfirmUnloadIfChanged,
  shouldShowSuccessMessage,
  submitButtonLabelOverride,
  tool,
  hasLatestData = true,
}: DashboardToolEditorProps) => {
  const [editorKey, incrementEditorKey] = useReducer(
    (current) => current + 1,
    0
  );
  useEffect(() => {
    if (hasLatestData) {
      // This ensures we see the latest content from the server.
      incrementEditorKey();
    }
  }, [hasLatestData]);
  const [formValidationMessage, setFormValidationMessage] = useState<
    string | null
  >(null);
  const {
    changeDescriptionState,
    collectionIdState,
    componentState,
    configurationState,
    dataForSubmit,
    hasChanges,
    iconState,
    inputsState,
    isUploading,
    itemName,
    keywordsState,
    nameState,
    orgShortcutState,
    resetAllFormStates,
    resetSubmitMode,
    selectedCollection,
    setSubmitMode,
    shouldShowPublish,
    shouldShowSaveDraft,
    submitMode,
    userShortcutState,
    validationErrorMessage,
    isDraft,
    isSuggestion,
  } = useToolFormState(tool, defaultCollectionId);

  const { hasRecovery } = useRecovery();
  const history = useHistory();
  const canManageOrgShortcuts = useHasOrgPermission('manage_org_shortcuts');
  const { suggestions } = useSuggestions(tool?.staticId);
  const hasIntercom = useHasIntercom();
  const [confirm, ConfirmPrompt] = useConfirm();

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

  const hasErrorsOrAlerts =
    hasRecovery ||
    formValidationMessage ||
    isDraft ||
    isSuggestion ||
    tool?.isArchived ||
    (deleteToolResult && errorFromMutation(deleteToolResult)) ||
    resultForCreateOrModify.error;

  const onSubmit = () => {
    if (isUploading || !collectionIdState.value) {
      return;
    }
    if (validationErrorMessage) {
      setFormValidationMessage(validationErrorMessage);
      return;
    }

    createOrModifyTool(
      dataForSubmit,
      // We use null to unset and undefined to represent "no changes"
      canManageOrgShortcuts && orgShortcutState.hasChanged
        ? orgShortcutState.value || null
        : undefined,
      userShortcutState.hasChanged ? userShortcutState.value || null : undefined
    );
    changeDescriptionState.reset();
  };

  const submitLoading = resultForCreateOrModify.loading;

  const onChangeDates = (
    start: DateTime,
    end: DateTime,
    preset: DateRangePreset | 'custom'
  ) => {
    trackEvent({
      category: 'dashboard_snippet',
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
      category: 'dashboard_snippet',
      action: 'change_grouping',
      label: 'Change grouping for insights',
      start: startDate.toISODate(),
      end: endDate.toISODate(),
      grouping,
    });
    setQueryParams({ grouping }, { shouldReplaceState: true });
  };

  const cancelButtonText = tool ? 'Discard Changes' : 'Delete Draft';
  const confirmPromptText = tool ? (
    <span>
      Are you sure you want to discard changes to{' '}
      <span
        css={css`
          font-style: italic;
        `}
      >
        {tool.name}
      </span>
      ?
    </span>
  ) : (
    'Are you sure you want to delete this draft?'
  );

  const textForConfirmButton = tool ? 'Discard Changes' : 'Delete Draft';

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
          onCancel();
        }
      }}
      disabled={
        tool?.isArchived ||
        isUploading ||
        submitLoading ||
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
        helpText="Keep your team on the same page by describing major changes to your snippets. Notifications are especially helpful for important process changes, bugs, and incidents."
        value={changeDescriptionState.value}
        onChange={changeDescriptionState.set}
      />
      <EditorMultiSubmitButton
        disabled={isUploading || submitLoading || !!tool?.isArchived}
        labelOverride={submitButtonLabelOverride}
        onChangeSubmitMode={setSubmitMode}
        submitMode={submitMode}
        onSubmit={onSubmit}
        shouldShowPublish={shouldShowPublish}
        shouldShowSaveDraft={shouldShowSaveDraft}
        shouldDisablePublishAndAlert={!changeDescriptionState.hasChanged}
        labelForSuggest={suggestionButtonText(tool?.branchType || null)}
      />
    </div>,
  ];

  const editActionBar = (
    <EditActionBarContainer
      visible={
        (!tool || hasChanges || isDraft || shouldShowSuccessMessage) &&
        !tool?.isArchived
      }
    >
      {actionBarButtons}
    </EditActionBarContainer>
  );

  return (
    <>
      <LoadingBar isLoading={!hasLatestData} />
      <ConfirmPrompt />
      {shouldConfirmUnloadIfChanged && hasChanges && <ConfirmPageUnload />}
      <PageContainer
        width="lg"
        meta={{ title: tool ? `Snippet: ${tool.name}` : 'New Snippet' }}
        editableIcon={
          <InlineEmojiPicker
            fallbackIcon={faMailBulk}
            initialEmoji={iconState.value || ''}
            onSelect={iconState.set}
          />
        }
        fallbackIcon={faMailBulk}
        heading={
          <Heading>
            <AutoResizeInput
              placeholder={tool ? 'Snippet name' : 'New snippet name'}
              autoFocus={!tool}
              value={nameState.value}
              onChange={(event) => nameState.set(event.target.value)}
            />
            <CollectionSelector
              selectedCollection={tool?.collection}
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
        actions={
          onClickDelete &&
          !tool?.isArchived && (
            <DashboardToolPageMenu onClickDelete={onClickDelete} />
          )
        }
      >
        <ViewAndEditPageGrid>
          <MainConfiguration>
            {hasErrorsOrAlerts && (
              <ErrorsAndAlerts>
                {tool && isDraft && !tool.isArchived && (
                  <DraftAlert itemName={itemName} />
                )}
                {tool && isSuggestion && !tool.isArchived && (
                  <ExistingSuggestionAlert createdAt={tool.createdAt} />
                )}
                {tool?.isArchived && isSuggestion && (
                  <BranchStatusAlert
                    item={tool}
                    additionalText="You can no longer edit this version. Click here to view the latest and make any new changes."
                    onClick={() =>
                      history.push(`/dashboard/snippets/${tool.staticId}`)
                    }
                  />
                )}
                {tool && (
                  <VersionedNodeArchivedNotice type="snippet" node={tool} />
                )}
                {!tool?.isArchived && <RecoveryAlert itemType="tool" />}
                {deleteToolResult && (
                  <ErrorAlert
                    title={`Error deleting ${itemName}`}
                    error={errorFromMutation(deleteToolResult)}
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
                      tool ? 'updating' : 'creating'
                    } ${itemName}`}
                    error={resultForCreateOrModify.error}
                  />
                )}
              </ErrorsAndAlerts>
            )}
            <ComponentConfigurationEditor
              key={editorKey}
              componentName={componentState.value}
              configurationState={configurationState}
              inputsState={inputsState}
              disabled={tool?.isArchived}
            />
          </MainConfiguration>
          <Sidebar>
            {componentState.value === 'GmailAction' && (
              <ContentCard
                fullBleed
                title={
                  <>
                    Actions
                    <ActionsHelpIcon />
                  </>
                }
              >
                <div
                  css={css`
                    overflow: hidden;
                    border-radius: 0.3rem;
                  `}
                >
                  <AppActionsAccordion
                    toolConfig={configurationState.value}
                    onChangeToolConfig={configurationState.set}
                    disabled={!!tool?.isArchived}
                  />
                </div>
              </ContentCard>
            )}
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
                disabled={!!tool?.isArchived}
                values={keywordsState.value}
                onChange={keywordsState.set}
              />
            </ContentCard>
            <ContentCard
              fullBleed
              title={
                <>
                  Shortcuts
                  <HelpIcon placement="top" content={shortcutsDescription} />
                </>
              }
            >
              <div
                css={css`
                  border-radius: 0.3rem;
                  overflow: hidden;
                `}
              >
                <ShortcutsInputGroup
                  orgShortcutState={orgShortcutState}
                  userShortcutState={userShortcutState}
                  collapsible
                  disabled={!!tool?.isArchived}
                />
              </div>
            </ContentCard>
            {tool && (
              <>
                <RelatedWorkflows tool={tool} />
                {suggestions.length > 0 && <Suggestions versionedNode={tool} />}
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
                    versionedNode={tool}
                    startDate={startDate}
                    endDate={endDate}
                  />
                )}
                <UsageCard
                  versionedNode={tool}
                  startDate={startDate}
                  endDate={endDate}
                  dateGrouping={dateGrouping}
                />
                <TopUsers
                  versionedNode={tool}
                  startDate={startDate}
                  endDate={endDate}
                />
                {tool.branchType === BranchTypeEnum.published && (
                  <>
                    <Separator />
                    <VersionedNodeHistory versionedNode={tool} />
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

export default DashboardToolEditor;
