import { Fragment, useMemo, useState } from 'react';

import { css, useTheme } from '@emotion/react';
import { faFolder, faPlus } from '@fortawesome/pro-solid-svg-icons';
import update from 'immutability-helper';
import { keyBy, keys, orderBy, values } from 'lodash';
import ReactSelect, { components } from 'react-select';
import tw from 'twin.macro';

import { BaseButton } from '@kenchi/ui/lib/Button';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { FormGroup } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';

import useCollections, { Collection } from '../../collection/useCollections';
import ErrorAlert from '../../components/ErrorAlert';
import { SpaceOrganizerItem } from './SpaceOrganizerItem';
import { SpaceOrganizerZone } from './SpaceOrganizerZone';
import { DragItem, WidgetFormState } from './types';

const styles = ({ colors }: KenchiTheme) => css`
  ${tw`grid grid-cols-2 gap-2`}

  .SpaceOrganizerItemSlot {
    ${tw`transition`}
  }

  .SpaceOrganizerZone {
    ${tw`rounded transition relative px-4`}

    &.SpaceOrganizerZone-selected {
      background: ${colors.gray[3]};
    }

    &.canDrop:not(.sameType) {
      ${tw`ring-4 ring-purple-600 ring-opacity-10 ring-inset`}
    }
    &.canDrop.isOver:not(.sameType) {
      ${tw`ring-opacity-30`}
    }
    &.canDrop.isOver {
      .SpaceOrganizerItemSlot {
        ${tw`h-1 rounded`}
        background-color: ${colors.accent[7]}
      }
    }
  }

  .SpaceOrganizerZone-title {
    ${tw`py-3 font-medium text-center`}
    color: ${colors.gray[12]};
  }
  .SpaceOrganizerZone-items {
    ${tw`overflow-auto space-y-1`}
  }
  .SpaceOrganizerZone-empty {
    ${tw`absolute inset-0 flex justify-center items-center text-center text-xl p-16`}
  }
  .add {
    ${tw`font-bold`}
    color: ${colors.accent[8]};
    &:hover {
      color: ${colors.accent[9]};
    }
  }
`;

const selectStyle = css`
  display: inline-block;
  width: calc(100% - 30px);
  margin-right: 10px;
`;

type Props = {
  widgets: WidgetFormState[];
  onChange: (widgets: WidgetFormState[]) => void;
};

const CollectionSelect = ({
  defaultCollection,
  onChange,
  availableCollections,
}: {
  defaultCollection: Collection | undefined;
  onChange: (collection: Collection | null) => void;
  availableCollections: Collection[];
}) => {
  const { colors } = useTheme();
  return (
    <FormGroup label={`Collection Select`} labelHidden>
      {(id) => (
        <ReactSelect
          autoFocus
          openMenuOnFocus={!defaultCollection}
          css={selectStyle}
          inputId={id}
          options={availableCollections}
          components={{
            ClearIndicator: () => null,
            // react-select does not add the proper role option by default. This
            // is a quick extension to add the correct role.
            // See: https://github.com/JedWatson/react-select/pull/4322#issuecomment-749134033
            Option: (props) => {
              const innerProps = {
                ...props.innerProps,
                role: 'option',
              };
              return <components.Option {...props} innerProps={innerProps} />;
            },
          }}
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
              cursor: 'pointer',
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
                : colors.gray[1],
              color: colors.accent[12],
              '&:hover': {
                backgroundColor: colors.accent[7],
              },
            }),
          }}
          placeholder={'Select a collection'}
          formatOptionLabel={(collection) => (
            <NameWithEmoji
              name={collection.name || <em>{'Unnamed Collection'}</em>}
              emoji={collection.icon}
              fallbackIcon={faFolder}
            />
          )}
          getOptionValue={(collection) => collection.id}
          onChange={onChange}
          defaultValue={defaultCollection}
          noOptionsMessage={() => {
            return 'No available collections';
          }}
          // This menuPortalTarget prop and pointerEvents: 'auto' constitute a bit
          // of a hack. We must portal the ReactSelect with menuPortalTarget in
          // order for the open menu to be able to extend beyond the bounds of the
          // Dialog. And we must set pointerEvents: 'auto' to allow interaction
          // with the open menu, since our Dialog uses Radix Dialog, which
          // prevents interaction outside of itself (as is the correct behavior of
          // a modal dialog). Since the menu content is portalled, it's outside of
          // the Dialog's DOM tree.
          // TODO(dave): remove that hack if/when we switch to Radix Select.
          menuPortalTarget={document.body}
        />
      )}
    </FormGroup>
  );
};

const SpaceLayoutEditor = ({ widgets, onChange }: Props) => {
  const [dropIndex, setDropIndex] = useState(widgets.length);
  const { collections: pendingCollections, loading } = useCollections();
  const editIndex = useMemo(
    () => widgets.findIndex((w) => w.editing),
    [widgets]
  );

  const itemsById = pendingCollections ? keyBy(pendingCollections, 'id') : {};
  // Only handles collections right now. This will change as we allow widgets in spaces.
  const collectionIds = widgets.map((widget) => widget.id);
  const selectedItems = widgets
    .map((widget) => ({
      formState: widget,
      data: itemsById[widget.id],
    }))
    .filter((item) => item.data);
  const availableCollections = orderBy(
    values(itemsById).filter(({ id }) => !collectionIds.includes(id)),
    'name'
  );
  const editIndexWidget = widgets[editIndex];
  const editIndexCollection = editIndexWidget?.id
    ? itemsById[editIndexWidget.id]
    : undefined;
  const loadingInitialData = !keys(itemsById) && loading;

  return (
    <div css={styles}>
      <SpaceOrganizerZone
        className="SpaceOrganizerZone"
        type="selectedCollection"
        accept={['selectedCollection', 'availableCollection']}
        onDrop={(item) => {
          // We insert the item at the new position first, so we don't get into weird order states. Then we filter out any duplicates that exist anywhere except at our drop index. This helps dropping the same item "after" itself, where the drop index is the item's index + 1, causing it to jump down the list one spot.
          const newItemIndex = Math.min(dropIndex, widgets.length);

          onChange(
            update(widgets, {
              $splice: [[newItemIndex, 0, item.formState]],
            }).filter(
              (widget, index) =>
                !(widget.id === item.formState.id && index !== newItemIndex)
            )
          );
        }}
      >
        <div className="SpaceOrganizerZone-items">
          {selectedItems.map(({ formState, data }, index) => (
            <Fragment key={formState.id}>
              {index === dropIndex && (
                <div className="SpaceOrganizerItemSlot" />
              )}
              <SpaceOrganizerItem
                type="selectedCollection"
                // TODO: My attempts at fancy typing may be doing more harm then
                // good here as formState seems constrained to the
                // non-placeholder variety here, requiring a cast
                item={{ index, formState, data } as DragItem}
                onHover={(position) => {
                  if (position === 'before') {
                    setDropIndex(index);
                  } else if (position === 'after') {
                    setDropIndex(index + 1);
                  }
                }}
                onRemove={() => {
                  onChange(update(widgets, { $splice: [[index, 1]] }));
                }}
                onEdit={() =>
                  onChange(
                    update(widgets, {
                      $apply: (widgets: WidgetFormState[]): WidgetFormState[] =>
                        widgets.map((formState, mapIndex) => ({
                          ...formState,
                          editing: mapIndex === index,
                        })),
                    })
                  )
                }
              />
            </Fragment>
          ))}

          {/* This allows us to display a bar showing an item can be dropped at the end of a the list */}
          {dropIndex >= collectionIds.length && (
            <div className="SpaceOrganizerItemSlot" />
          )}
          {selectedItems.length === 0 && loadingInitialData && (
            <LoadingSpinner name="dashboard space organizer" />
          )}
          <BaseButton
            className="add"
            onClick={() => {
              onChange(
                update(widgets, {
                  $apply: (widgets: WidgetFormState[]): WidgetFormState[] =>
                    widgets.map((formState) => ({
                      ...formState,
                      editing: false,
                    })),
                  $splice: [
                    [
                      selectedItems.length,
                      0,
                      {
                        type: 'collection-placeholder',
                        editing: true,
                        id: `collection-placeholder-${Date.now()}`,
                      },
                    ],
                  ],
                })
              );
            }}
          >
            <NameWithEmoji name="Add to this space" fallbackIcon={faPlus} />
          </BaseButton>
        </div>
      </SpaceOrganizerZone>

      <div>
        {editIndex >= 0 && (
          <>
            <div className="SpaceOrganizerZone-title">Select collection</div>
            <CollectionSelect
              key={editIndexWidget.id}
              onChange={(collection) => {
                if (collection) {
                  onChange(
                    update(widgets, {
                      [editIndex]: {
                        $apply: (formState) => ({
                          ...formState,
                          type: 'collection',
                          id: collection.id,
                          error: undefined,
                        }),
                      },
                    })
                  );
                }
              }}
              availableCollections={availableCollections}
              defaultCollection={editIndexCollection}
            />
            <div>
              {editIndexWidget.error && (
                <ErrorAlert
                  title="Error saving space"
                  error={<>{editIndexWidget.error}</>}
                  disableAnimation
                />
              )}
            </div>
          </>
        )}{' '}
        {editIndex < 0 && widgets.length > 0 && (
          <div className="SpaceOrganizerZone-title">Select an item to edit</div>
        )}
      </div>
    </div>
  );
};

export default SpaceLayoutEditor;
