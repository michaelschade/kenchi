import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  faArrowCircleRight,
  faLayerGroup,
  faPencilAlt,
} from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router-dom';

import { MenuItemLink } from '@kenchi/ui/lib/DropdownMenu';

import { BranchTypeEnum, WorkflowListItemFragment } from '../graphql/generated';
import { useHasCollectionPermission } from '../graphql/useSettings';
import ActionButton from '../previewTile/ActionButton';
import CopyLinkMenuItem from '../previewTile/CopyLinkMenuItem';
import MenuActionButton from '../previewTile/MenuActionButton';
import ItemIcon from '../previewTile/PreviewIcon';
import PreviewTile, { PreviewRef } from '../previewTile/PreviewTile';
import { CollectionTag, ItemTypeTag } from '../previewTile/Tags';
import { useSearchAnalytics } from '../search/useSearch';
import ShortcutMenuItem, { ShortcutModal } from '../shortcuts/ShortcutMenuItem';
import { trackEvent } from '../utils/analytics';
import { getPath, sendToEdit, sendToView } from '../utils/history';

type Props = {
  workflow: WorkflowListItemFragment;
  toggleCollapse?: () => void;
  searchIndex?: number;
  showTags?: boolean;
  style?: React.CSSProperties;
};

export default forwardRef(
  (
    { workflow, toggleCollapse, searchIndex, style = {}, showTags }: Props,
    ref: React.Ref<PreviewRef>
  ) => {
    const history = useHistory();
    const divRef = useRef<HTMLDivElement>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [shortcutModalOpen, setShortcutModalOpen] = useState(false);

    const canPublish = useHasCollectionPermission(
      workflow.collection.id,
      'publish_workflow'
    );
    const { trackSearchEvent } = useSearchAnalytics();
    const sendSearchEvent = useCallback(() => {
      if (searchIndex !== undefined) {
        trackSearchEvent('click', workflow.staticId, searchIndex + 1);
      }
    }, [searchIndex, trackSearchEvent, workflow.staticId]);
    const exec = useCallback(() => {
      sendSearchEvent();
      sendToView(history, workflow);
    }, [history, sendSearchEvent, workflow]);
    const edit = useCallback(() => {
      sendSearchEvent();
      sendToEdit(history, workflow);
    }, [history, sendSearchEvent, workflow]);

    const editUrl = getPath(workflow, 'edit');
    const suggestUrl = getPath(workflow, 'edit', { suggest: true });

    useImperativeHandle(
      ref,
      () => ({
        edit,
        exec,
        open: exec,
        toggleCollapse,
      }),
      [edit, exec, toggleCollapse]
    );

    const { name, description } = workflow;
    const isDraft = workflow.branchType === BranchTypeEnum.draft;
    const canEdit = canPublish || isDraft;

    const openShortcutModal = () => {
      trackEvent({
        category: 'workflows',
        action: 'open_shortcut_modal',
        source: 'menu',
      });
      setShortcutModalOpen(true);
    };
    const closeShortcutModal = (reason: string) => {
      trackEvent({
        category: 'workflows',
        action: `${reason}_shortcut_modal`,
        source: 'menu',
      });
      setShortcutModalOpen(false);
    };

    return (
      <>
        <PreviewTile
          ref={divRef}
          name={name}
          description={description}
          tags={
            showTags && (
              <>
                <ItemTypeTag itemType="playbook" />
                <CollectionTag collection={workflow.collection} />
              </>
            )
          }
          icon={<ItemIcon item={workflow} />}
          onClick={exec}
          actionsForceShow={menuVisible}
          style={style}
          actionButtons={
            <>
              <MenuActionButton
                onOpenChange={setMenuVisible}
                open={menuVisible}
              >
                <ShortcutMenuItem
                  onClick={openShortcutModal}
                  staticId={workflow.staticId}
                />
                <MenuItemLink
                  to={`/collections/${workflow.collection.id}`}
                  icon={faLayerGroup}
                >
                  View collection
                </MenuItemLink>
                {canEdit && (
                  <MenuItemLink to={editUrl} icon={faPencilAlt}>
                    Edit
                  </MenuItemLink>
                )}
                {!isDraft && (
                  <MenuItemLink
                    to={suggestUrl}
                    icon={canEdit ? undefined : faPencilAlt}
                  >
                    Suggest an edit
                  </MenuItemLink>
                )}
                <CopyLinkMenuItem
                  onAfterCopyLink={() => setMenuVisible(false)}
                  to={
                    isDraft
                      ? `${process.env.REACT_APP_HOST}/dashboard/playbooks/${workflow.staticId}/branch/${workflow.branchId}`
                      : `${process.env.REACT_APP_HOST}/dashboard/playbooks/${workflow.staticId}`
                  }
                />
              </MenuActionButton>
              <ActionButton
                primary={true}
                color="blue"
                label="open"
                icon={faArrowCircleRight}
                onClick={exec}
              />
            </>
          }
        />
        <ShortcutModal
          isOpen={shortcutModalOpen}
          onClose={closeShortcutModal}
          staticId={workflow.staticId}
        />
      </>
    );
  }
);
