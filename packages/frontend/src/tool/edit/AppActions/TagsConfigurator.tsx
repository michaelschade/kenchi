import { useState } from 'react';

import { ApolloError } from '@apollo/client';
import { css, useTheme } from '@emotion/react';
import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';
import ReactSelect from 'react-select';

import { FormGroup } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import ErrorAlert from '../../../components/ErrorAlert';
import {
  ExternalReferenceTypeEnum,
  KenchiErrorFragment,
} from '../../../graphql/generated';
import useExternalDataReferences from '../../../pageContext/useExternalDataReferences';
import { StatusOfSync } from '../../../pageContext/useSyncTags';
import { filterNullOrUndefined } from '../../../utils';
import { SyncButton } from './SyncButton';

const selectStyle = css`
  display: inline-block;
  width: calc(100% - 30px);
  margin-right: 10px;
`;

type PropsForTagsConfigurator = {
  value: string[] | undefined;
  onChange: (tags: string[]) => void;
  referenceSource: 'intercom' | 'zendesk';
  appName: string;
  actionTypeForSync: 'extractIntercomTags' | 'extractZendeskTags';
  placeholder?: string;
};

export const TagsConfigurator = ({
  value: propValue,
  onChange,
  referenceSource,
  appName,
  actionTypeForSync,
  placeholder,
}: PropsForTagsConfigurator) => {
  const { colors } = useTheme();
  const [errorFromSync, setErrorFromSync] = useState<
    JSX.Element | ApolloError | KenchiErrorFragment | null
  >(null);
  const [statusOfSync, setStatusOfSync] = useState<StatusOfSync>('new');
  const {
    data,
    loading,
    error,
    refetch: refetchTags,
  } = useExternalDataReferences(
    {
      referenceType: ExternalReferenceTypeEnum.tag,
      referenceSource,
    },
    {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert title="Error loading tags" error={error} />;
  }

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

  let value: string[];
  value = propValue || [];

  return (
    <FormGroup label={`${appName} Tagging`} labelHidden>
      {(id) => (
        <>
          <ReactSelect
            css={selectStyle}
            inputId={id}
            options={uniqueExternalTags}
            components={{ ClearIndicator: () => null }}
            styles={{
              menuPortal: (base) => ({
                ...base,
                pointerEvents: 'auto',
              }),
              control: (provided) => ({
                ...provided,
                backgroundColor: colors.gray[0],
                borderColor: colors.gray[6],
                '&:hover': {
                  borderColor: colors.gray[8],
                },
              }),
              multiValue: (provided) => ({
                ...provided,
                backgroundColor: colors.gray[5],
                borderColor: colors.gray[7],
                color: colors.gray[11],
              }),
              multiValueLabel: (provided) => ({
                ...provided,
                color: colors.gray[12],
              }),
              multiValueRemove: (provided, state) => ({
                ...provided,
                color: colors.gray[12],
                '&:hover': {
                  backgroundColor: colors.red[6],
                  color: colors.red[9],
                },
              }),
              clearIndicator: (provided) => ({
                ...provided,
                cursor: 'pointer',
                color: colors.gray[12],
                '&:hover': {
                  color: colors.red[9],
                },
              }),
              dropdownIndicator: (provided) => ({
                ...provided,
                cursor: 'pointer',
                '&:hover': {
                  color: colors.gray[12],
                },
              }),
              input: (provided) => ({
                ...provided,
                color: colors.gray[12],
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: colors.gray[3],
                borderColor: colors.gray[6],
                zIndex: 100,
              }),
              menuList: (provided) => ({
                ...provided,
                backgroundColor: colors.gray[3],
                borderColor: colors.gray[6],
                color: colors.gray[12],
              }),
              option: (provided, state) => ({
                ...provided,
                cursor: 'pointer',
                backgroundColor: state.isFocused
                  ? colors.accent[7]
                  : colors.gray[3],
                color: colors.accent[12],
                '&:hover': {
                  backgroundColor: colors.accent[7],
                },
              }),
            }}
            isMulti
            placeholder={placeholder}
            getOptionLabel={(tag) => tag.label}
            getOptionValue={(tag) => tag.id}
            value={externalTags.filter((tag) =>
              value?.includes(tag.referenceId)
            )}
            onChange={(tags) => {
              // `tags` is a union type dependent on if isMulti is set, use conditions
              // to scope it down
              if (tags && 'length' in tags) {
                const tagReferenceIds = tags
                  .map((tag) => tag.referenceId)
                  .filter(filterNullOrUndefined);
                onChange(tagReferenceIds);
              } else {
                onChange([]);
              }
            }}
            noOptionsMessage={() => {
              if (statusOfSync === 'syncing') {
                return `Please wait, still syncing ${appName} tags…`;
              }
              return `No ${appName} tags found`;
            }}
            // This menuPortalTarget prop and pointerEvents: 'auto' constitute a bit
            // of a hack. We must portal the ReactSelect with menuPortalTarget in
            // order for the open menu to be able to extend beyond the bounds of the
            // Dailog. And we must set pointerEvents: 'auto' to allow interaction
            // with the open menu, since our Dialog uses Radix Dialog, which
            // prevents interaction outside of itself (as is the correct behavior of
            // a modal dialog). Since the menu content is portalled, it's outside of
            // the Dialog's DOM tree.
            // TODO(dave): remove that hack if/when we switch to Radix Select.
            menuPortalTarget={document.body}
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
        </>
      )}
    </FormGroup>
  );
};
