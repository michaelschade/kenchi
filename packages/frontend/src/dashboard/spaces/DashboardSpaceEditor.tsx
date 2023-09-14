import { css } from '@emotion/react';
import { useHistory } from 'react-router-dom';
import tw from 'twin.macro';

import Result, { failure, isSuccess, success } from '@kenchi/shared/lib/Result';
import { CollectionWidget } from '@kenchi/slate-tools/lib/types';
import { PrimaryButton, SecondaryButton } from '@kenchi/ui/lib/Button';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import {
  AutoResizeInput,
  EditActionBarContainer,
  MainConfiguration,
  Sidebar,
  ViewAndEditPageGrid,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import MultiSelect from '@kenchi/ui/lib/MultiSelect';
import { Stack } from '@kenchi/ui/lib/Stack';

import ConfirmPageUnload from '../../components/ConfirmPageUnload';
import ErrorAlert from '../../components/ErrorAlert';
import { SpaceCreateInput, SpaceEditorFragment } from '../../graphql/generated';
import useSettings from '../../graphql/useSettings';
import { ResultForCreateOrModify } from '../../tool/edit/DashboardToolEditor';
import useConfirm from '../../utils/useConfirm';
import useGroups from '../groups/useGroups';
import SpaceLayoutEditor from './SpaceLayoutEditor';
import { WidgetFormState } from './types';
import { useSpaceFormState } from './useSpaceFormState';

type Props = {
  space?: SpaceEditorFragment | null;
  resultForCreateOrModify: ResultForCreateOrModify;
  createOrModifySpace: (spaceData: SpaceCreateInput) => void;
  shouldConfirmUnloadIfChanged?: boolean;
};

const validateFormState = (
  widgetFormStates: WidgetFormState[]
): Result<WidgetFormState[], { widgets: WidgetFormState[] }> => {
  let error = false;
  const validatedFormStates = widgetFormStates.map((widgetFormState) => {
    if (widgetFormState.type !== 'collection') {
      error = true;
      widgetFormState.error = 'Collection required';
    } else {
      widgetFormState.error = undefined;
    }
    return widgetFormState;
  });
  return error
    ? failure({ widgets: validatedFormStates })
    : success(validatedFormStates);
};

export const DashboardSpaceEditor = ({
  space,
  resultForCreateOrModify,
  createOrModifySpace,
  shouldConfirmUnloadIfChanged = true,
}: Props) => {
  const {
    nameState,
    widgetsState,
    visibleToOrgState,
    groupIdsState,
    hasChanges,
    resetAllFormStates,
  } = useSpaceFormState(space);
  const history = useHistory();
  const settings = useSettings();
  const { loading: groupsLoading, groups: allGroups } = useGroups();
  const [confirm, ConfirmPrompt] = useConfirm();

  const cancelButtonText = space ? 'Discard changes' : 'Discard new space';
  const confirmPromptText = space ? (
    <span>
      Are you sure you want to discard changes to{' '}
      <span
        css={css`
          font-style: italic;
        `}
      >
        {space.name}
      </span>
      ?
    </span>
  ) : (
    'Are you sure you want to discard this new space?'
  );
  return (
    <>
      <ConfirmPrompt />
      {shouldConfirmUnloadIfChanged && hasChanges && <ConfirmPageUnload />}
      <PageContainer
        heading={
          <AutoResizeInput
            placeholder={space ? 'Space name' : 'New space name'}
            autoFocus={!space}
            value={nameState.value}
            onChange={(event) => nameState.set(event.target.value)}
          />
        }
        width="xl"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (resultForCreateOrModify.loading) {
              return;
            }

            const validatedFormSate = validateFormState(widgetsState.value);
            if (isSuccess(validatedFormSate)) {
              widgetsState.set(validatedFormSate.data);
            } else {
              widgetsState.set(validatedFormSate.error.widgets);
              return;
            }

            // We're reconstructing the widgets from the collection ID to keep the downstream components easier to understand.
            // TODO: figure out if we should keep the widget data from the backend
            const widgets: CollectionWidget[] = widgetsState.value.map(
              (widgetFormState) => ({
                type: 'widget-collection',
                collectionId: widgetFormState.id!,
                children: [{ text: '' }],
              })
            );

            createOrModifySpace({
              name: nameState.value,
              widgets,
              visibleToOrg: visibleToOrgState.value,
              visibleToGroupIds: visibleToOrgState.value
                ? []
                : groupIdsState.value,
            });
          }}
        >
          <ErrorAlert
            title="Error saving space"
            error={resultForCreateOrModify.error}
          />
          <ViewAndEditPageGrid>
            <MainConfiguration>
              <ContentCard title="In this space">
                <SpaceLayoutEditor
                  widgets={widgetsState.value}
                  onChange={widgetsState.set}
                />
              </ContentCard>
            </MainConfiguration>
            <Sidebar>
              <ContentCard title="Sharing">
                <Stack gap={2}>
                  <label css={tw`m-0 flex flex-row gap-2`}>
                    <input
                      type="radio"
                      name="visibleTo"
                      checked={visibleToOrgState.value}
                      onChange={() => {
                        visibleToOrgState.set(true);
                      }}
                      css={tw`h-6`}
                    />
                    <div css={tw`max-w-prose`}>
                      Everyone at{' '}
                      {settings?.viewer.organization?.name || 'my organization'}{' '}
                      can view this space
                    </div>
                  </label>
                  <label
                    css={tw`m-0 flex flex-row gap-2`}
                    onClick={(event) => {
                      // By default, onClick will focus the label, which means if
                      // you click into the select below, it loses focus, which
                      // dismisses the menu.
                      if (!visibleToOrgState.value) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="visibleTo"
                      checked={!visibleToOrgState.value}
                      onChange={() => {
                        visibleToOrgState.set(false);
                      }}
                      css={tw`h-6`}
                    />
                    <Stack gap={2}>
                      <div>Only certain groups can view this space</div>
                      <div css={tw`max-w-lg`}>
                        {!visibleToOrgState.value ? (
                          <MultiSelect
                            options={allGroups}
                            loading={groupsLoading}
                            selectedOptionIds={groupIdsState.value}
                            onChange={groupIdsState.set}
                            showTokens
                          />
                        ) : null}
                      </div>
                    </Stack>
                  </label>
                </Stack>
              </ContentCard>
            </Sidebar>
          </ViewAndEditPageGrid>
          <EditActionBarContainer visible={!space || hasChanges}>
            <SecondaryButton
              onClick={async () => {
                if (
                  !hasChanges ||
                  (await confirm(confirmPromptText, {
                    textForConfirmButton: cancelButtonText,
                    dangerous: true,
                  }))
                ) {
                  resetAllFormStates();
                  if (!space) {
                    history.goBack();
                  }
                }
              }}
            >
              {cancelButtonText}
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={!hasChanges || resultForCreateOrModify.loading}
            >
              {space ? 'Save' : 'Create'}
              {resultForCreateOrModify.loading && (
                <LoadingSpinner
                  name="dashboard space dialog mutation"
                  pull="right"
                  style={{ margin: '5px 0 0 5px' }}
                />
              )}
            </PrimaryButton>
          </EditActionBarContainer>
        </form>
      </PageContainer>
    </>
  );
};
