import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { css } from '@emotion/react';
import { faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
import { Editor } from 'slate';
import { useSlate } from 'slate-react';

import { SecondaryButton } from '@kenchi/ui/lib/Button';
import { Input } from '@kenchi/ui/lib/Form';
import { HeaderIconLink } from '@kenchi/ui/lib/Headers';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import Tooltip from '@kenchi/ui/lib/Tooltip';
import useHotkey from '@kenchi/ui/lib/useHotkey';

import ErrorAlert from '../../components/ErrorAlert';
import { CustomModal } from '../../components/Modals';
import {
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../../graphql/generated';
import {
  SelectableList,
  SelectableListActionConfig,
  SelectableListItem,
  SelectableListRef,
} from '../../list/SelectableList';
import { ListItemType } from '../../list/useList';
import ActionButton from '../../previewTile/ActionButton';
import ItemIcon from '../../previewTile/PreviewIcon';
import PreviewTile, { PreviewRef } from '../../previewTile/PreviewTile';
import { CollectionTag } from '../../previewTile/Tags';
import { SearchFilters } from '../../search/filter';
import { SearchProvider, useSearch } from '../../search/useSearch';
import ToolPreviewTooltip from '../../tool/ToolPreviewTooltip';
import useRunTool from '../../tool/useRunTool';
import { trackEvent } from '../../utils/analytics';
import useWorkflow from '../../workflow/useWorkflow';

const searchContainer = css`
  display: flex;
  align-items: center;
`;

const currentItemAndSearchContainerStyles = css`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
`;

const ACTION_KEYS: SelectableListActionConfig<PreviewRef>[] = [
  { key: 'Enter', action: 'exec' },
];

const ToolPreview = ({
  tool,
  children,
}: {
  tool: ToolListItemFragment;
  children: React.ReactNode;
}) => {
  const [, { getPreview }] = useRunTool(tool, {});
  return (
    <ToolPreviewTooltip name={tool.name} previewContents={getPreview()}>
      {children}
    </ToolPreviewTooltip>
  );
};

const ElementItem = forwardRef(
  (
    {
      item,
      onClick,
    }: {
      item: ToolListItemFragment | WorkflowListItemFragment;
      onClick: () => void;
    },
    ref: React.Ref<PreviewRef>
  ) => {
    useImperativeHandle(
      ref,
      () => ({
        exec: onClick,
        open: onClick,
        edit: () => {},
      }),
      [onClick]
    );
    const tile = (
      <PreviewTile
        onClick={onClick}
        name={item.name}
        icon={<ItemIcon item={item} />}
        tags={[
          <CollectionTag
            key={item.collection.id}
            collection={item.collection}
          />,
        ]}
        description={item.description}
        actionButtons={
          <ActionButton
            primary={true}
            color="blue"
            onClick={onClick}
            label="insert"
            icon={faPlusCircle}
          />
        }
      />
    );
    if (item.__typename === 'ToolLatest') {
      return <ToolPreview tool={item}>{tile}</ToolPreview>;
    } else {
      return <Tooltip overlay={item.name}>{tile}</Tooltip>;
    }
  }
);

type KenchiElementModalProps = {
  itemName: 'playbook' | 'snippet';
  currentItemStaticId?: string;
  field: 'tools' | 'workflows' | 'links';
  requireSearching?: boolean;
  searchFilters: SearchFilters;
  addItem: (
    editor: Editor,
    item: ToolListItemFragment | WorkflowListItemFragment
  ) => void;
  insertText: string;
  onNew?: () => void;
  onClickRemove?: () => void;
  textForRemoveButton?: string;
  onClose: () => void;
  children?: React.ReactNode;
  isOpen: boolean;
  isWide: boolean;
};
function KenchiElementModal({
  itemName,
  currentItemStaticId,
  field,
  requireSearching,
  searchFilters,
  addItem,
  insertText,
  onNew,
  onClickRemove,
  textForRemoveButton,
  onClose,
  children,
  isOpen,
  isWide,
}: KenchiElementModalProps) {
  const editor = useSlate();
  const {
    searchResults,
    shortcutResult,
    loading,
    error,
    searchInputValue,
    setSearchInputValue,
    setFilters,
    setHitsPerPage,
    trackSearchEvent,
    suggestSync,
  } = useSearch();

  useEffect(() => {
    if (isOpen) {
      suggestSync();
    }
    // Only run the first time we open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setFilters(searchFilters);
  }, [searchFilters, setFilters]);
  useEffect(() => {
    setHitsPerPage(10);
  }, [setHitsPerPage]);
  const filteredList = useMemo(() => {
    if (shortcutResult) {
      return [shortcutResult, ...(searchResults || [])] as ListItemType[];
    } else {
      return searchResults as ListItemType[];
    }
  }, [searchResults, shortcutResult]);

  const { workflow: currentItem } = useWorkflow(currentItemStaticId);

  const selectableListRef = useRef<SelectableListRef>(null);

  useEffect(() => {
    selectableListRef.current?.resetSelection();
  }, [searchInputValue, selectableListRef]);

  useHotkey(
    'n',
    useCallback(
      (e) => {
        if (onNew) {
          e.preventDefault();
          onNew();
        }
      },
      [onNew]
    )
  );

  const onClick = useCallback(
    (item, index) => () => {
      trackSearchEvent('click', item.staticId, index + 1);
      onClose();
      addItem(editor, item);
    },
    [trackSearchEvent, onClose, addItem, editor]
  );

  const listItems = useMemo(() => {
    if (requireSearching && searchInputValue === '') {
      return [];
    } else if (loading || !filteredList) {
      return [
        <LoadingSpinner key="loading" name="kenchi element modal list" />,
      ];
    } else if (error) {
      return [
        <ErrorAlert
          key="error"
          title={`Error loading ${itemName}s`}
          error={error}
        />,
      ];
    } else {
      return filteredList.map((item, index) => (
        <SelectableListItem<PreviewRef> key={item.id}>
          {(ref) => (
            <ElementItem ref={ref} item={item} onClick={onClick(item, index)} />
          )}
        </SelectableListItem>
      ));
    }
  }, [
    searchInputValue,
    loading,
    error,
    itemName,
    filteredList,
    onClick,
    requireSearching,
  ]);

  const onBack = useCallback(() => {
    trackEvent({
      category: 'workflow_editor',
      action: `cancel_modal_insert_${field}`,
      label: `Close modal to insert ${field} without inserting anything`,
    });
    onClose();
  }, [onClose, field]);

  if (searchResults.some((item) => item.__typename === 'Collection')) {
    // This is a hack to avoid an error when the search results contain a
    // collection, which can happen momentarily before the search result filter
    // kicks in.
    // TODO: Fix this by letting the initial filter get passed into useSearch.
    return null;
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onBack={onBack}
      title={insertText}
      width={isWide ? 'small' : 'extension'}
    >
      {children}
      <div css={currentItemAndSearchContainerStyles}>
        {currentItem && (
          <Tooltip
            mouseEnterDelay={0}
            overlay={`Currently selected ${itemName}`}
          >
            <PreviewTile
              onClick={() => {}}
              name={currentItem.name}
              icon={<ItemIcon item={currentItem} />}
              description={currentItem.description}
              actionEnabled={false}
            />
          </Tooltip>
        )}

        <div css={searchContainer}>
          <div style={{ flexGrow: 1 }}>
            <Input
              className="hotkeys-allow-up hotkeys-allow-down hotkeys-allow-enter"
              placeholder={`Search ${itemName}s`}
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              autoFocus={!children}
            />
          </div>
          {onNew && (
            <div
              style={{
                position: 'relative',
                marginLeft: '10px',
                flexShrink: 1,
              }}
            >
              <HeaderIconLink
                onClick={onNew}
                title="Create a new snippet"
                icon={faPlusCircle}
                size="lg"
              />
            </div>
          )}
        </div>
        <SelectableList<PreviewRef>
          ref={selectableListRef}
          actionKeys={ACTION_KEYS}
        >
          {listItems}
        </SelectableList>
        {onClickRemove && (
          <SecondaryButton block onClick={onClickRemove}>
            {textForRemoveButton || `Remove ${itemName}`}
          </SecondaryButton>
        )}
      </div>
    </CustomModal>
  );
}

export default function KenchiElementModalWithSearch(
  props: KenchiElementModalProps
) {
  return (
    <SearchProvider>
      <KenchiElementModal {...props} />
    </SearchProvider>
  );
}
