import { useMemo, useState } from 'react';

import { css } from '@emotion/react';
import { faEdit } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import isEqual from 'fast-deep-equal';
import { useHistory } from 'react-router-dom';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { isSlateEmpty } from '@kenchi/slate-tools/lib/utils';
import { Accordion } from '@kenchi/ui/lib/Accordion';
import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';
import { PickerButton } from '@kenchi/ui/lib/EmojiPicker';
import {
  Form,
  FormGroup,
  InputGroup,
  LabelWithDescription,
  TextAreaGroup,
} from '@kenchi/ui/lib/Form';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';

import CollectionSelector from '../collection/CollectionSelector';
import { BranchStatusAlert } from '../components/BranchStatus';
import ConfirmPageUnload from '../components/ConfirmPageUnload';
import EditActionBar, {
  EditType,
  getEditActionBarProps,
} from '../components/EditActionBar';
import RecoveryAlert from '../components/RecoveryAlert';
import {
  BranchTypeEnum,
  WorkflowCreateInput,
  WorkflowFragment,
} from '../graphql/generated';
import { useHasCollectionPermission } from '../graphql/useSettings';
import { RecoveryEditor, RecoveryProvider } from '../slate/Editor/Recovery';
import {
  SearchKeywords,
  searchKeywordsDescription,
} from '../tool/edit/SearchKeywords';
import { editorContainer } from '../tool/edit/ToolEditor';
import { computeIsUploading } from '../tool/edit/utils';
import { useWorkflowFormState } from './useWorkflowFormState';

export const startingContents: SlateNode[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

export const migrateContents = (contents: SlateNode[]) =>
  contents.map((n) => migrateNode(n));

const migrateNode = (node: SlateNode, parent?: SlateNode): SlateNode => {
  if (typeof node === 'object' && (node.text !== undefined || node.type)) {
    if (node.type === 'workflow-embed' || node.type === 'tool') {
      if (parent && parent.type === 'void-wrapper') {
        return node;
      } else {
        return {
          type: 'void-wrapper',
          children: [
            { type: 'void-spacer', children: [{ text: '' }] },
            node,
            { type: 'void-spacer', children: [{ text: '' }] },
          ],
        };
      }
    } else if (node.children) {
      return {
        ...node,
        children: node.children.map((c) => migrateNode(c, node)),
      };
    } else {
      return node;
    }
  } else {
    console.error('Unexpected playbook contents', node);
    return node;
  }
};

type WorkflowEditorProps = {
  workflow?: WorkflowFragment | null;
  onSubmit: (data: WorkflowCreateInput) => void;
  onBack: () => void;
  submitLoading: boolean;
  editType: EditType;
  shouldWarn?: boolean;
  defaultCollectionId?: string;
};

export const validateWorkflow = (data: WorkflowCreateInput) => {
  const missingFields = [];
  let missingFieldsConcat;

  if (!data.name) {
    missingFields.push('a name');
  }
  if (isEqual(data.contents, startingContents)) {
    missingFields.push('some contents');
  }

  if (missingFields.length === 1) {
    missingFieldsConcat = missingFields[0];
  } else if (missingFields.length === 2) {
    missingFieldsConcat = `${missingFields[0]} and ${missingFields[1]}`;
  }

  if (missingFields.length > 0) {
    return `Please give your playbook ${missingFieldsConcat}.`;
  } else {
    return null;
  }
};

const splitForm = css`
  display: grid;
  grid-template-columns: auto min-content;
  gap: 0.75rem;
`;

function WorkflowEditor({
  workflow,
  onSubmit,
  onBack,
  submitLoading,
  editType,
  shouldWarn = true,
  defaultCollectionId,
}: WorkflowEditorProps) {
  const history = useHistory();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    nameState,
    descriptionState,
    collectionIdState,
    contentsState,
    iconState,
    keywordsState,
    showChangeAlertState,
    changeDescriptionState,
  } = useWorkflowFormState(workflow, defaultCollectionId);

  const canPublish = useHasCollectionPermission(
    collectionIdState.value,
    'publish_workflow'
  );

  const isUploading = useMemo(
    () => contentsState.value && computeIsUploading(contentsState.value),
    [contentsState.value]
  );

  // When the form submits with changes, we'll navigate back to the view page.
  // This triggers a page unload event (thus a prompt) before we get new state
  // from the backend to "unset" our change tracking. So any time we submit,
  // we'll just skip the prompt on page unload.
  const [confirmPageUnload, setConfirmPageUnload] = useState(true);

  const hasChanges =
    nameState.hasChanged ||
    descriptionState.hasChanged ||
    collectionIdState.hasChanged ||
    contentsState.hasChanged ||
    iconState.hasChanged ||
    keywordsState.hasChanged;

  const doSubmit = (branchType: BranchTypeEnum) => {
    if (isUploading || !collectionIdState.value) {
      return;
    }
    const data: WorkflowCreateInput = {
      icon: iconState.value,
      name: nameState.value,
      keywords: keywordsState.value,
      branchType,
      description: descriptionState.value,
      collectionId: collectionIdState.value,
      contents: contentsState.value,
      majorChangeDescription:
        showChangeAlertState.value &&
        !changeDescriptionState.value.every(isSlateEmpty)
          ? changeDescriptionState.value
          : null,
    };

    const validationErrorMessage = validateWorkflow(data);
    if (validationErrorMessage) {
      setErrorMessage(validationErrorMessage);
      return;
    }
    setConfirmPageUnload(false);
    onSubmit(data);
  };

  let statusAlert = null;
  let formDisabled = false;
  if (workflow?.isArchived) {
    formDisabled = true;
    statusAlert = (
      <BranchStatusAlert
        item={workflow}
        additionalText="You can no longer edit this version. Click here to view the latest and make any new changes."
        onClick={() => history.push(`/playbooks/${workflow.staticId}`)}
      />
    );
  }

  const editorContext = {
    canPublish,
    doSubmit,
    editingObject: workflow,
    editType,
    formDisabled,
    hasChanges,
    isUploading,
    onBack,
    submitLoading,
  };

  return (
    <RecoveryProvider type="workflow" id={workflow?.staticId || null}>
      {shouldWarn && hasChanges && confirmPageUnload ? (
        <ConfirmPageUnload />
      ) : null}
      {statusAlert}
      {!formDisabled && <RecoveryAlert itemType="workflow" />}
      <Form
        onSubmit={() => doSubmit(workflow?.branchType || BranchTypeEnum.draft)}
      >
        <div css={splitForm}>
          <InputGroup
            label="Name"
            value={nameState.value}
            onChange={(e) => {
              nameState.set(e.target.value);
            }}
            disabled={formDisabled}
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
            selectedCollection={workflow?.collection}
            value={collectionIdState.value}
            onChange={collectionIdState.set}
            disabled={formDisabled}
          />
        </FormGroup>
        <TextAreaGroup
          label="Description"
          value={descriptionState.value}
          onChange={(e) => {
            descriptionState.set(e.target.value.replace('\n', ''));
          }}
          disabled={formDisabled}
        />

        <FormGroup label="Contents">
          <div css={editorContainer}>
            <RecoveryEditor
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
              size="small"
              value={contentsState.value}
              onChange={contentsState.set}
              disabled={formDisabled}
            />
          </div>
        </FormGroup>

        <div>
          <LabelWithDescription label="Search keywords" />
          <HelpIcon placement="top" content={searchKeywordsDescription} />
          <SearchKeywords
            values={keywordsState.value}
            onChange={keywordsState.set}
          />
        </div>

        <div>
          <LabelWithDescription label="Change alert" />
          <HelpIcon
            placement="top"
            content="Keep your team on the same page by describing major changes to your playbooks. Notifications are especially helpful for important process changes, bugs, and incidents."
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
            containerStyle={css`
              margin-top: 1rem;
            `}
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
      </Form>
    </RecoveryProvider>
  );
}

export default WorkflowEditor;
