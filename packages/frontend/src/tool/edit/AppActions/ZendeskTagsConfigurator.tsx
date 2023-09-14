import { useCallback, useMemo, useState } from 'react';

import { ApolloError } from '@apollo/client';
import { css } from '@emotion/react';
import { faTag, faTags } from '@fortawesome/pro-solid-svg-icons';
import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';

import { Collapsible, CollapsibleContent } from '@kenchi/ui/lib/Collapsible';
import { MultiInput, RadioGroup } from '@kenchi/ui/lib/Form';
import { listFormat } from '@kenchi/ui/lib/utils/text';

import ErrorAlert from '../../../components/ErrorAlert';
import {
  ExternalReferenceTypeEnum,
  KenchiErrorFragment,
} from '../../../graphql/generated';
import useExternalDataReferences from '../../../pageContext/useExternalDataReferences';
import { StatusOfSync } from '../../../pageContext/useSyncTags';
import { SyncButton } from './SyncButton';

export type ZendeskTagsConfig = {
  tagsToAdd?: string[];
  tagsToRemove?: string[];
  tagsToSet?: string[];
};

type ZendeskTagsRadioOption =
  | 'keep_all_other_tags'
  | 'remove_all_other_tags'
  | 'remove_some_other_tags';

export const tooltipForZendeskTags = (value: ZendeskTagsConfig) => {
  const { tagsToAdd, tagsToRemove, tagsToSet } = value;
  const willSetTags = tagsToSet && tagsToSet.length > 0;
  const willAddTags = tagsToAdd && tagsToAdd.length > 0;
  const willRemoveSomeTags = tagsToRemove && tagsToRemove.length > 0;

  if (willSetTags) {
    return `Set tags to ${listFormat(tagsToSet)}`;
  }
  if (willAddTags && !willRemoveSomeTags) {
    return `Add tags: ${listFormat(tagsToAdd)}`;
  }
  if (willRemoveSomeTags && !willAddTags) {
    return `Remove tags: ${listFormat(tagsToRemove)}`;
  }
  if (willAddTags && willRemoveSomeTags) {
    return (
      <>
        <div>Add tags: {listFormat(tagsToAdd)}</div>
        <div>Remove tags: {listFormat(tagsToRemove)}</div>
      </>
    );
  }
  // This should never happen, I just haven't figured out how to make TypeScript
  // know that we'll definitely go down one of the above paths instead.
  return 'No tags to set';
};

export const iconForZendeskTags = (value: ZendeskTagsConfig) => {
  const { tagsToAdd, tagsToRemove, tagsToSet } = value;
  const countOfChangedTags =
    (tagsToAdd || []).length +
    (tagsToRemove || []).length +
    (tagsToSet || []).length;
  return countOfChangedTags > 1 ? faTags : faTag;
};

const selectStyle = css`
  display: inline-block;
  width: calc(100% - 30px);
  margin-right: 10px;
`;

type PropsForZendeskTagsConfigurator = {
  value: ZendeskTagsConfig | undefined;
  onChange: (zendeskTagsConfig: ZendeskTagsConfig) => void;
};

export const ZendeskTagsConfigurator = ({
  value: zendeskTagsConfig,
  onChange,
}: PropsForZendeskTagsConfigurator) => {
  const referenceSource = 'zendesk';
  const appName = 'Zendesk';
  const actionTypeForSync = 'extractZendeskTags';
  const placeholder = 'Select tags to add';

  const [errorFromSync, setErrorFromSync] = useState<
    JSX.Element | ApolloError | KenchiErrorFragment | null
  >(null);
  const [statusOfSync, setStatusOfSync] = useState<StatusOfSync>('new');

  const { tagsToAdd, tagsToSet, tagsToRemove } = zendeskTagsConfig || {};
  const willSetTags = tagsToSet && tagsToSet.length > 0;
  const willAddTags = tagsToAdd && tagsToAdd.length > 0;
  const willRemoveSomeTags = tagsToRemove && tagsToRemove.length > 0;

  const [tagsToAddOrSet, setTagsToAddOrSet] = useState<string[]>(
    (tagsToAdd && tagsToAdd.length > 0 ? tagsToAdd : tagsToSet) || []
  );

  const initialRadioOption: ZendeskTagsRadioOption = useMemo(() => {
    if (willAddTags && !willRemoveSomeTags) {
      return 'keep_all_other_tags';
    }
    if (willAddTags && willRemoveSomeTags) {
      return 'remove_some_other_tags';
    }
    if (willSetTags) {
      return 'remove_all_other_tags';
    }
    return 'keep_all_other_tags';
  }, [willAddTags, willRemoveSomeTags, willSetTags]);

  const [selectedRadioOption, setSelectedRadioOption] =
    useState<ZendeskTagsRadioOption>(initialRadioOption);

  const onChangeInputs = useCallback(
    (
      tagsToAddOrSet: string[],
      tagsToRemove: string[],
      selectedRadioOption:
        | 'keep_all_other_tags'
        | 'remove_all_other_tags'
        | 'remove_some_other_tags'
    ) => {
      switch (selectedRadioOption) {
        case 'keep_all_other_tags':
          onChange({
            tagsToAdd: tagsToAddOrSet,
          });
          break;
        case 'remove_all_other_tags':
          onChange({
            tagsToSet: tagsToAddOrSet,
          });
          break;
        case 'remove_some_other_tags':
          onChange({
            tagsToAdd: tagsToAddOrSet,
            tagsToRemove,
          });
          break;
        default:
          throw new Error(`Unexpected radio option: ${selectedRadioOption}`);
      }
    },
    [onChange]
  );

  const { data, refetch: refetchTags } = useExternalDataReferences(
    {
      referenceType: ExternalReferenceTypeEnum.tag,
      referenceSource,
    },
    {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  );

  const viewer = data?.viewer;
  if (!viewer?.organization) {
    // This is only null in the case of a logged out user
    return null;
  }

  const existingTags = viewer.organization?.externalDataReferences ?? [];

  const externalTags = sortBy(
    viewer.organization.externalDataReferences,
    (tag) => tag.label.toLowerCase()
  );
  const uniqueExternalTags = uniqBy(externalTags, 'referenceId');

  return (
    <div
      css={css`
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(0, 1fr);
      `}
    >
      <div>
        <MultiInput
          onChange={(tagsToAddOrSet) => {
            setTagsToAddOrSet(tagsToAddOrSet);
            onChangeInputs(
              tagsToAddOrSet,
              tagsToRemove || [],
              selectedRadioOption
            );
          }}
          values={tagsToAddOrSet}
          menuEnabled={true}
          css={selectStyle}
          placeholder={placeholder}
          options={uniqueExternalTags.map((tag) => ({
            label: tag.label,
            value: tag.referenceId,
          }))}
          noOptionsMessage={() => {
            if (statusOfSync === 'syncing') {
              return `Please wait, still syncing ${appName} tags…`;
            }
            return `No ${appName} tags found`;
          }}
        />
        <SyncButton
          onErrorFromSync={setErrorFromSync}
          onChangeStatusOfSync={setStatusOfSync}
          refetchTags={refetchTags}
          appName={appName}
          actionTypeForSync={actionTypeForSync}
          referenceSource={referenceSource}
          existingTags={existingTags}
        />
        <ErrorAlert title="Error syncing tags" error={errorFromSync} />
      </div>
      <div>
        <RadioGroup
          options={[
            { value: 'keep_all_other_tags', label: 'Keep all other tags' },
            { value: 'remove_all_other_tags', label: 'Remove all other tags' },
            {
              value: 'remove_some_other_tags',
              label: 'Remove some other tags',
            },
          ]}
          value={selectedRadioOption}
          onChange={(value) => {
            onChangeInputs(
              tagsToAddOrSet,
              value === 'remove_some_other_tags' &&
                tagsToRemove &&
                tagsToRemove.length > 0
                ? tagsToRemove
                : [],
              value as ZendeskTagsRadioOption
            );
            setSelectedRadioOption(value as ZendeskTagsRadioOption);
          }}
        />
        <Collapsible open={selectedRadioOption === 'remove_some_other_tags'}>
          <CollapsibleContent>
            <MultiInput
              onChange={(tagsToRemove) => {
                onChangeInputs(
                  tagsToAdd || [],
                  tagsToRemove,
                  selectedRadioOption
                );
              }}
              values={tagsToRemove || []}
              menuEnabled={true}
              css={[
                selectStyle,
                css`
                  padding-left: 1.5rem;
                  padding-top: 0.5rem;
                `,
              ]}
              placeholder={'Select tags to remove'}
              options={uniqueExternalTags
                .filter((tag) => !tagsToAddOrSet.includes(tag.label))
                .map((tag) => ({
                  label: tag.label,
                  value: tag.referenceId,
                }))}
              formatCreateLabel={(label) => `Remove "${label}"`}
              noOptionsMessage={() => {
                if (statusOfSync === 'syncing') {
                  return `Please wait, still syncing ${appName} tags…`;
                }
                return `No ${appName} tags found`;
              }}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
