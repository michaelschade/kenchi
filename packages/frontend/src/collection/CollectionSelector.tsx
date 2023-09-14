import { ReactNode, useEffect, useState } from 'react';

import { css } from '@emotion/react';
import { IconDefinition } from '@fortawesome/pro-regular-svg-icons';
import {
  faFolder,
  faLock,
  faPlus,
  faShareAlt,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import sortBy from 'lodash/sortBy';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import ErrorAlert from '../components/ErrorAlert';
import { MenuSheet, Option } from '../components/MenuSheet';
import { ToolFragment, WorkflowFragment } from '../graphql/generated';
import useSettings, { useHasOrgPermission } from '../graphql/useSettings';
import { faKenchiCity } from '../utils';
import getLocalForage from '../utils/localForage';
import {
  CollectionPermission,
  useCollectionPermission,
} from '../utils/useCollectionPermission';
import NewCollectionModal from './NewCollectionModal';
import useCollections from './useCollections';

export const LAST_USED_COLLECTION_KEY = 'LAST_USED_COLLECTION';

const CREATE_COLLECTION_OPTION: Option = {
  label: 'Create new collection',
  value: 'NEW_COLLECTION',
};

const styleItem = css`
  ${tw`flex gap-1 justify-between items-center`}

  > .icon {
    display: none;
  }

  // TODO: this is an ugly and boundary-violating artifact of letting you pass
  // an ItemContainer into MenuSheet.
  button &,
  [data-state='checked'] > &,
  div:hover > & {
    > .icon {
      display: block;
    }
  }
`;

const styleCreateCollection = ({ colors }: KenchiTheme) => css`
  ${tw`flex gap-1`}
  color: ${colors.accent[9]};
`;

const styleSecondaryIcon = ({ colors }: KenchiTheme) => css`
  color: ${colors.gray[9]};
`;

type Props = {
  selectedCollection?:
    | ToolFragment['collection']
    | WorkflowFragment['collection']
    | null
    | undefined;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  button?: ReactNode;
};

export default function CollectionSelector({
  selectedCollection,
  value,
  onChange,
  disabled,
  label = 'Collection',
  description = 'Organize related content with collections',
  button,
}: Props) {
  const { collections, loading, error, refetch } = useCollections();
  const [shouldShowNewCollectionModal, setShouldShowNewCollectionModal] =
    useState(false);

  const canCreateCollections = useHasOrgPermission('manage_collections');

  const sortedCollections = collections
    ? sortBy(collections, (c) => c.name.toLowerCase())
    : null;

  const selectCollection = (id: string): void => {
    setShouldShowNewCollectionModal(false);
    onChange(id);
  };

  // If we don't have a collection set and we require one, use last
  useEffect(() => {
    if (!value && sortedCollections) {
      const uncategorizedCollection =
        sortedCollections.find((c) => c.name === 'Uncategorized') ||
        sortedCollections.find((c) => c.name === 'Shared');

      if (uncategorizedCollection) {
        onChange(uncategorizedCollection.id);
      } else {
        getLocalForage()
          .getItem<string>(LAST_USED_COLLECTION_KEY)
          .then((id) => {
            if (id && sortedCollections.find((c) => c.id === id)) {
              onChange(id);
            } else {
              onChange(sortedCollections[0].id);
            }
          });
      }
    }
  }, [value, sortedCollections, onChange]);

  let options: any[];
  if (loading) {
    disabled = true;
    options = [];
    if (selectedCollection) {
      options.push({
        label: selectedCollection.name,
        value: selectedCollection.id,
      });
    } else {
      options.push({
        label: 'Loading...',
        value: '',
      });
    }
  } else if (sortedCollections) {
    // Hack to preserve previous behavior while we move towards a Collection-required world.
    options = sortedCollections.map((c) => ({ label: c.name, value: c.id }));
    if (canCreateCollections) {
      options.unshift(CREATE_COLLECTION_OPTION);
    }
  } else {
    return <ErrorAlert title="Error loading collections" error={error} />;
  }

  return (
    <>
      <NewCollectionModal
        isOpen={shouldShowNewCollectionModal}
        onBack={() => setShouldShowNewCollectionModal(false)}
        onCreate={(id: string) => {
          refetch();
          selectCollection(id);
        }}
        onSelectExisting={selectCollection}
      />
      {value !== undefined && (
        <MenuSheet
          label={label}
          description={description}
          title="Select collection"
          disabled={disabled}
          options={options}
          value={value}
          onChange={(val) => {
            if (val === CREATE_COLLECTION_OPTION.value) {
              // terrible hack due to conflict between Menu returning focus to Button and Radix Dialog autofocus.
              // it may be fixed if we use Radix.Dropdown so we can open modal after dropdown fully closes
              // or if we use Headless UI Modal for Modal
              setTimeout(() => {
                setShouldShowNewCollectionModal(true);
              }, 50);
            } else {
              onChange(val);

              if (val) {
                getLocalForage().setItem<string>(LAST_USED_COLLECTION_KEY, val);
              }
            }
          }}
          button={button}
          itemComponent={SelectorOption}
        />
      )}
    </>
  );
}

const SelectorOption = ({ option }: { option?: Option }) => {
  const { collections } = useCollections();
  const settings = useSettings();
  const collection = collections?.find((c) => c.id === option?.value);
  const [permission, permissionString] = useCollectionPermission(
    collection,
    settings?.viewer.user?.id
  );

  if (!option) return <>Loading...</>;

  if (option.value === CREATE_COLLECTION_OPTION.value) {
    return (
      <div css={styleCreateCollection}>
        <span>
          <FontAwesomeIcon icon={faPlus} fixedWidth size="sm" />
        </span>
        {option.label}
      </div>
    );
  }

  if (!collection) {
    return <div css={styleItem}>{option.label}</div>;
  }

  return (
    <div css={styleItem}>
      <NameWithEmoji
        name={collection.name || <em>Unnamed</em>}
        emoji={collection.icon}
        fallbackIcon={faFolder}
      />

      {permission && (
        <div className="icon">
          <Tooltip placement="left" overlay={permissionString}>
            <FontAwesomeIcon
              icon={COLLECTION_PERMISSION_ICONS[permission]}
              size="sm"
              css={styleSecondaryIcon}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

const COLLECTION_PERMISSION_ICONS: Record<
  CollectionPermission,
  IconDefinition
> = {
  EVERYONE: faKenchiCity,
  PRIVATE: faLock,
  SOME: faShareAlt,
};
