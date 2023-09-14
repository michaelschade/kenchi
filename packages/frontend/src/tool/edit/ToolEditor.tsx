import { useMemo, useState } from 'react';

import { useApolloClient } from '@apollo/client';
import { css } from '@emotion/react';
import { faEdit } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHistory } from 'react-router-dom';

import { Commands } from '@kenchi/commands';
import { fromHTML } from '@kenchi/slate-tools/lib/fromHTML';
import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { isSlateEmpty } from '@kenchi/slate-tools/lib/utils';
import { Accordion } from '@kenchi/ui/lib/Accordion';
import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors, KenchiTheme } from '@kenchi/ui/lib/Colors';
import { PickerButton } from '@kenchi/ui/lib/EmojiPicker';
import {
  FormControlsContainer,
  FormGroup,
  InputGroup,
  LabelWithDescription,
} from '@kenchi/ui/lib/Form';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';

import CollectionSelector from '../../collection/CollectionSelector';
import { BranchStatusAlert } from '../../components/BranchStatus';
import EditActionBar, {
  EditType,
  getEditActionBarProps,
} from '../../components/EditActionBar';
import RecoveryAlert from '../../components/RecoveryAlert';
import {
  BranchTypeEnum,
  ToolCreateInput,
  ToolFragment,
  ToolListItemFragment,
} from '../../graphql/generated';
import {
  useHasCollectionPermission,
  useHasOrgPermission,
} from '../../graphql/useSettings';
import { RecoveryEditor, RecoveryProvider } from '../../slate/Editor/Recovery';
import {
  handleUploadComplete,
  uploadImageFromURL,
} from '../../slate/Editor/withImages';
import { trackEvent } from '../../utils/analytics';
import InteractiveTool from '../InteractiveTool';
import { ActionsHelpIcon } from './AppActions/ActionsHelpIcon';
import { AppActionsAccordion } from './AppActions/AppActionsAccordion';
import ComponentConfigurationEditor from './ComponentConfigurationEditor';
import { SearchKeywords, searchKeywordsDescription } from './SearchKeywords';
import {
  shortcutsDescription,
  ShortcutsInputGroup,
} from './ShortcutsInputGroup';
import { useToolFormState } from './useToolFormState';
import { computeIsUploading } from './utils';

export const editorContainer = ({ colors }: KenchiTheme) => css`
  border: 1px solid ${colors.gray[7]};
  border-radius: 0.25rem;
  background-color: ${colors.gray[0]};
  overflow: hidden;
`;

export type ToolEditorOptions = {
  defaultCollectionId?: string;
  defaultComponent?: 'GmailAction' | 'OpenURLs';
  proposedSnippet?: Commands['app']['proposeNewSnippet']['args'];
};

type ToolEditorProps = {
  tool?: ToolFragment | null;
  onSubmit: (
    data: ToolCreateInput,
    orgShortcut: string | null | undefined,
    userShortcut: string | null | undefined
  ) => void;
  onBack: () => void;
  submitLoading: boolean;
  editType: EditType;
  showShortcuts?: boolean;
} & ToolEditorOptions;

const container = ({ colors }: KenchiTheme) => css`
  h2 {
    font-size: 0.9em;
    font-weight: 700;
    background: linear-gradient(
      20deg,
      ${colors.accent[8]} 0%,
      ${colors.accent[11]} 70%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-top: 10px;
    margin-bottom: 10px;
  }
`;

const splitForm = css`
  display: grid;
  grid-template-columns: auto min-content;
  gap: 0.75rem;
`;

export default function ToolEditor({
  tool,
  onSubmit,
  onBack,
  submitLoading,
  editType,
  showShortcuts = false,
  defaultCollectionId,
  defaultComponent,
  proposedSnippet,
}: ToolEditorProps) {
  // TODO: make "are you sure you want to cancel" prompt

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const history = useHistory();

  const client = useApolloClient();

  const proposedSnippetSlate = useMemo(() => {
    if (!proposedSnippet) {
      return;
    }
    const { html, text } = proposedSnippet;
    let fragment: SlateNode[];
    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const onImage = (src: string) => {
        if (!src.startsWith('https://kenchi-')) {
          // TODO: be smarter
          uploadImageFromURL(src, client).then((result) => {
            handleUploadComplete(src, result);
          });
          return true;
        }
        return false;
      };
      fragment = fromHTML(parsed.body, {
        splitOnBr: false,
        doubleParagraphs: false,
        onImage,
      });
    } else if (text) {
      fragment = text
        .split('\n')
        .map((line) => ({ type: 'paragraph', children: [{ text: line }] }));
      // TODO
    } else {
      // TODO: error message
      return undefined;
    }
    return fragment;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposedSnippet, client]);

  const {
    nameState,
    collectionIdState,
    componentState,
    inputsState,
    configurationState,
    keywordsState,
    iconState,
    showChangeAlertState,
    changeDescriptionState,
    userShortcutState,
    orgShortcutState,
  } = useToolFormState(
    tool,
    defaultCollectionId,
    defaultComponent,
    proposedSnippetSlate
  );

  const canPublish = useHasCollectionPermission(
    collectionIdState.value,
    'publish_tool'
  );
  const canManageOrgShortcuts = useHasOrgPermission('manage_org_shortcuts');

  // TODO: this is kind of hacked in here...find a better way to thread this
  // through.
  const isUploading = useMemo(() => {
    return (
      componentState.value === 'GmailAction' &&
      configurationState.value?.data &&
      computeIsUploading(configurationState.value.data.children)
    );
  }, [componentState.value, configurationState.value]);

  const hasChanges =
    collectionIdState.hasChanged ||
    inputsState.hasChanged ||
    keywordsState.hasChanged ||
    nameState.hasChanged ||
    orgShortcutState.hasChanged ||
    iconState.hasChanged ||
    userShortcutState.hasChanged;

  const validateTool = (data: ToolCreateInput) => {
    if (!data.name) {
      return 'Please give your automation a name.';
    }
  };

  const doSubmit = (branchType: BranchTypeEnum) => {
    if (isUploading || !collectionIdState.value) {
      return;
    }
    const data = {
      branchType,
      icon: iconState.value,
      name: nameState.value,
      description: tool?.description ?? '', // Preserve original description
      collectionId: collectionIdState.value,
      component: componentState.value,
      keywords: keywordsState.value,
      inputs: inputsState.value,
      configuration: configurationState.value,
      majorChangeDescription:
        showChangeAlertState.value &&
        !changeDescriptionState.value.every(isSlateEmpty)
          ? changeDescriptionState.value
          : null,
    };

    const validationErrorMessage = validateTool(data);
    if (validationErrorMessage) {
      setErrorMessage(validationErrorMessage);
      return;
    }

    onSubmit(
      data,
      // We use null to unset and undefined to represent "no changes"
      canManageOrgShortcuts && orgShortcutState.hasChanged
        ? orgShortcutState.value || null
        : undefined,
      userShortcutState.hasChanged ? userShortcutState.value || null : undefined
    );
  };

  let statusAlert;
  let formDisabled = false;
  if (tool?.isArchived) {
    formDisabled = true;
    statusAlert = (
      <BranchStatusAlert
        item={tool}
        additionalText="You can no longer edit this version. Click here to view the latest and make any new changes."
        onClick={() => history.push(`/snippets/${tool.staticId}`)}
      />
    );
  }

  let toolPreview = null;
  if (nameState.value && collectionIdState.value) {
    const generatedTool: ToolListItemFragment = {
      __typename: 'ToolRevision',
      id: '__generated__',
      staticId: '__generated__',
      isArchived: false,
      createdAt: new Date().toISOString(),
      collection: {
        __typename: 'Collection',
        id: collectionIdState.value,
        name: '__generated__',
        icon: '__generated__',
      },
      keywords: [],
      branchId: null,
      branchType: BranchTypeEnum.published,
      name: nameState.value,
      description: '',
      icon: iconState.value,
      inputs: inputsState.value,
      component: componentState.value,
      configuration: configurationState.value,
    };
    toolPreview = (
      <>
        <h2>Preview</h2>
        <InteractiveTool
          inEditMode={true}
          tool={generatedTool}
          trackAction={(action: string) =>
            trackEvent({
              category: 'tools',
              action,
              object: '__generated__',
              source: 'edit_tool_preview',
            })
          }
        />
      </>
    );
  }

  const editorContext = {
    canPublish,
    doSubmit,
    editingObject: tool,
    editType,
    formDisabled,
    hasChanges,
    isUploading,
    onBack,
    submitLoading,
  };

  return (
    <RecoveryProvider type="tool" id={tool?.staticId ?? null}>
      {statusAlert}
      {!formDisabled && <RecoveryAlert itemType="tool" />}
      <div css={container}>
        <FormControlsContainer>
          <div css={splitForm}>
            <InputGroup
              label="Name"
              value={nameState.value}
              onChange={(e) => nameState.set(e.target.value)}
              autoFocus
            />
            <FormGroup label="Icon">
              {(id) => (
                <PickerButton
                  id={id}
                  initialEmoji={iconState.value || ''}
                  onSelect={iconState.set}
                  style={{ display: 'block' }}
                />
              )}
            </FormGroup>
          </div>

          <FormGroup>
            <CollectionSelector
              selectedCollection={tool?.collection}
              value={collectionIdState.value}
              onChange={collectionIdState.set}
            />
          </FormGroup>

          <div>
            {componentState.value === 'GmailAction' && (
              <LabelWithDescription label="Text to insert" />
            )}

            <ComponentConfigurationEditor
              componentName={componentState.value}
              configurationState={configurationState}
              inputsState={inputsState}
            />
          </div>

          {componentState.value === 'GmailAction' && (
            <div>
              <LabelWithDescription label="Actions" />
              <ActionsHelpIcon />
              <div css={editorContainer}>
                <AppActionsAccordion
                  toolConfig={configurationState.value}
                  onChangeToolConfig={configurationState.set}
                />
              </div>
            </div>
          )}

          <div>
            <LabelWithDescription label="Search keywords" />
            <HelpIcon placement="top" content={searchKeywordsDescription} />
            <SearchKeywords
              values={keywordsState.value}
              onChange={keywordsState.set}
            />
          </div>

          {showShortcuts ? (
            <div>
              <LabelWithDescription label="Shortcuts" />
              <HelpIcon placement="top" content={shortcutsDescription} />
              <div css={editorContainer}>
                <ShortcutsInputGroup
                  orgShortcutState={orgShortcutState}
                  userShortcutState={userShortcutState}
                  collapsible
                />
              </div>
            </div>
          ) : null}

          <div>
            <LabelWithDescription label="Change alert" />
            <HelpIcon
              placement="top"
              content="Keep your team on the same page by describing major changes to your snippets. Notifications are especially helpful for important process changes, bugs, and incidents."
            />
            <div css={editorContainer}>
              <Accordion
                sections={[
                  {
                    label: !changeDescriptionState.value.every(isSlateEmpty)
                      ? 'Edit change alert'
                      : 'Add change alert',
                    key: 'change_alert',
                    content: (
                      <div
                        css={css`
                          padding-top: 0.25rem;
                        `}
                      >
                        <RecoveryEditor
                          recoveryKey="majorChange"
                          style={{ minHeight: '150px' }}
                          spellCheck
                          withFormatting
                          withImages
                          withURLLinks
                          size="small"
                          value={changeDescriptionState.value}
                          onChange={changeDescriptionState.set}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {errorMessage && (
            <Alert
              title="Some information is missing"
              description={errorMessage}
              onClick={() => setErrorMessage(null)}
              primaryColor={BaseColors.error}
              icon={
                <FontAwesomeIcon
                  icon={faEdit}
                  css={css`
                    font-size: 0.8rem;
                  `}
                />
              }
            />
          )}

          <EditActionBar {...getEditActionBarProps(editorContext)} />

          {toolPreview}
        </FormControlsContainer>
      </div>
    </RecoveryProvider>
  );
}
