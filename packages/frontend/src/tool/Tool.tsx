import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { css } from '@emotion/react';
import {
  faCheckCircle,
  faExternalLinkAlt,
  faEye,
  faPlay,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHistory } from 'react-router-dom';

import { DEFAULT_TOOLTIP_MOUSEENTER_DELAY_MS } from '@kenchi/ui/lib/Tooltip';

import { EditType } from '../components/EditActionBar';
import { CustomModal, PageModal } from '../components/Modals';
import { isDemoUrl } from '../demo/utils';
import { ToolListItemFragment } from '../graphql/generated';
import { usePageUrl } from '../pageContext/pageUrl/usePageUrl';
import ActionButton from '../previewTile/ActionButton';
import MenuActionButton from '../previewTile/MenuActionButton';
import ItemIcon from '../previewTile/PreviewIcon';
import PreviewTile, { PreviewRef } from '../previewTile/PreviewTile';
import { CollectionTag, ItemTypeTag } from '../previewTile/Tags';
import { useSearchAnalytics } from '../search/useSearch';
import { ShortcutModal } from '../shortcuts/ShortcutMenuItem';
import { trackEvent } from '../utils/analytics';
import { sendToEdit } from '../utils/history';
import EditTool from './edit/EditTool';
import InteractiveTool from './InteractiveTool';
import { ToolMenu } from './ToolMenu';
import ToolPreviewTooltip from './ToolPreviewTooltip';
import useRunTool, { InputFillStatus, ToolRunStatus } from './useRunTool';

type Props = {
  tool: ToolListItemFragment;
  editType: 'modal' | 'page' | null;
  analyticsSource?: string;
  searchIndex?: number;
  toggleCollapse?: () => void;
  style?: React.CSSProperties;
  showTags?: boolean;
  shouldShowDashboardLink?: boolean;
  shouldShowMenu?: boolean;
  onToggleRunModal?: (show: boolean) => void;
  onBeforeRun?: () => Promise<void>;
  onRun?: (success: boolean) => void;
};

type ToolAction =
  | 'open_modal_edit_tool'
  | 'cancel_modal_edit_tool'
  | 'open_modal_run_tool'
  | 'run_directly'
  | 'error_run_directly'
  | 'update_from_modal'
  | 'cancel_from_modal'
  | 'delete_from_modal'
  | 'cancel_modal_run_tool'
  | 'run_from_modal'
  | 'error_run_from_modal';

const searchTrackableActions = new Set([
  'open_modal_edit_tool',
  'open_modal_run_tool',
  'run_directly',
]);
const Tool = forwardRef(
  (
    {
      tool,
      editType: modalOrPage,
      analyticsSource,
      searchIndex,
      toggleCollapse,
      style = {},
      showTags,
      shouldShowDashboardLink = false,
      shouldShowMenu = true,
      onToggleRunModal,
      onBeforeRun,
      onRun,
    }: Props,
    ref: React.Ref<PreviewRef>
  ) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
    const [hoveringPreviewTile, setHoveringPreviewTile] = useState(false);
    const previewTileRef = useRef<HTMLDivElement>(null);
    const [editType, setEditType] = useState<EditType>('normal');
    const [showRunModal, setShowRunModal] = useState(false);
    const [shortcutModalOpen, setShortcutModalOpen] = useState<boolean>(false);
    const history = useHistory();
    const { trackSearchEvent } = useSearchAnalytics();
    const [
      runTool,
      { getPreview, canRun, inputFillStatus, status, error, resetError },
    ] = useRunTool(tool, {});
    const previewContents = getPreview();
    const needsInput =
      inputFillStatus === InputFillStatus.alwaysPrompts ||
      inputFillStatus === InputFillStatus.failedToFill;

    useEffect(() => {
      if (!hoveringPreviewTile) {
        setTooltipIsOpen(false);
        return;
      }
      const timeout = setTimeout(() => {
        setTooltipIsOpen(true);
      }, DEFAULT_TOOLTIP_MOUSEENTER_DELAY_MS);
      return () => clearTimeout(timeout);
    }, [hoveringPreviewTile]);

    const trackAction = useCallback(
      (action: ToolAction) => {
        trackEvent({
          category: 'tools',
          action,
          object: tool.staticId,
          source: analyticsSource,
          searchIndex,
          inputFillStatus,
        });

        if (searchIndex !== undefined && searchTrackableActions.has(action)) {
          trackSearchEvent('click', tool.staticId, searchIndex + 1);
        }
      },
      [
        tool.staticId,
        analyticsSource,
        searchIndex,
        inputFillStatus,
        trackSearchEvent,
      ]
    );

    const onClickEdit = useCallback(
      (suggest?: boolean) => {
        if (modalOrPage === 'modal') {
          trackAction('open_modal_edit_tool');
          setShowEditModal(true);
          setEditType(suggest ? 'suggestOnly' : 'normal');
        } else if (modalOrPage === 'page') {
          sendToEdit(history, tool, suggest ? { suggest: true } : undefined);
        }
      },
      [tool, history, modalOrPage, trackAction]
    );

    const cancelEditModal = useCallback(() => {
      trackAction('cancel_modal_edit_tool');
      setShowEditModal(false);
    }, [trackAction]);

    const openRunModal = useCallback(() => {
      trackAction('open_modal_run_tool');
      setShowRunModal(true);
    }, [trackAction]);

    useEffect(() => {
      if (typeof showRunModal === 'boolean') {
        onToggleRunModal?.(showRunModal);
      }
    }, [onToggleRunModal, showRunModal]);

    const run = useCallback(async () => {
      if (!canRun) {
        return;
      }
      if (status === ToolRunStatus.error) {
        resetError();
      } else {
        if (onBeforeRun) {
          await onBeforeRun();
        }
        const success = await runTool();
        if (success) {
          trackAction('run_directly');
        } else {
          trackAction('error_run_directly');
        }
        onRun?.(success);
      }
    }, [canRun, resetError, runTool, onBeforeRun, onRun, status, trackAction]);

    const runOrOpen = useCallback(() => {
      if (needsInput) {
        openRunModal();
      } else {
        run();
      }
    }, [needsInput, openRunModal, run]);

    useImperativeHandle(
      ref,
      () => ({
        edit: onClickEdit,
        exec: runOrOpen,
        open: openRunModal,
        toggleCollapse,
      }),
      [onClickEdit, runOrOpen, openRunModal, toggleCollapse]
    );

    const pageUrl = usePageUrl();
    const [menuVisible, setMenuVisible] = useState(false);

    const isDemo = pageUrl && isDemoUrl(pageUrl);

    const actionEnabled: boolean = canRun;
    let primaryActionLabel: React.ReactNode;
    if (status === 'running') {
      primaryActionLabel = <>running&hellip;</>;
    } else if (status === 'justRan') {
      primaryActionLabel = (
        <>
          <FontAwesomeIcon icon={faCheckCircle} /> ran!
        </>
      );
    } else if (needsInput) {
      primaryActionLabel = <>run&hellip;</>;
    } else {
      primaryActionLabel = 'run';
    }

    const openShortcutModal = () => {
      trackEvent({
        category: 'tools',
        action: 'open_shortcut_modal',
        source: 'menu',
      });
      setShortcutModalOpen(true);
    };
    const closeShortcutModal = (reason: string) => {
      trackEvent({
        category: 'tools',
        action: `${reason}_shortcut_modal`,
        source: 'menu',
      });
      setShortcutModalOpen(false);
    };

    const actionButtons = (
      <>
        {shouldShowMenu && (
          <MenuActionButton
            onOpenChange={setMenuVisible}
            open={menuVisible}
            compact={true}
          >
            <ToolMenu
              tool={tool}
              onClickEdit={editType ? onClickEdit : undefined}
              onClickOpen={openRunModal}
              onClickShortcut={openShortcutModal}
              onAfterCopyLink={() => setMenuVisible(false)}
            />
          </MenuActionButton>
        )}
        {shouldShowDashboardLink && (
          <ActionButton
            onClick={() =>
              window.open(
                `${process.env.REACT_APP_HOST}/dashboard/snippets/${tool.staticId}`,
                '_blank'
              )
            }
            icon={faExternalLinkAlt}
            color="grey"
            title="Open in Kenchi dashboard"
          />
        )}
        <ActionButton
          onClick={openRunModal}
          icon={faEye}
          color="grey"
          title="Preview snippet"
        />
        <ActionButton
          onClick={runOrOpen}
          primary={true}
          disabled={!actionEnabled}
          icon={status === ToolRunStatus.justRan ? undefined : faPlay}
          label={primaryActionLabel}
          color="green"
          title={
            canRun
              ? undefined
              : 'Snippet can only be run from the Kenchi extension'
          }
        />
      </>
    );

    const previewTile = (
      <PreviewTile
        ref={previewTileRef}
        name={tool.name}
        description={tool.description}
        tags={
          showTags && (
            <>
              <ItemTypeTag itemType="snippet" />
              <CollectionTag collection={tool.collection} />
            </>
          )
        }
        icon={<ItemIcon item={tool} />}
        onClick={runOrOpen}
        actionEnabled={actionEnabled}
        actionButtons={actionButtons}
        actionsForceShow={
          menuVisible || status === 'running' || status === 'justRan'
        }
        running={status === 'running'}
        error={error}
        style={Object.assign({ position: 'relative' }, style)}
        onMouseEnter={() => setHoveringPreviewTile(true)}
        onMouseLeave={() => setHoveringPreviewTile(false)}
        onMouseMove={(e) => {
          const isWithinPreviewTile = !!(
            e.target instanceof Node &&
            previewTileRef.current?.contains(e.target)
          );
          if (isWithinPreviewTile === hoveringPreviewTile) {
            return;
          }
          setHoveringPreviewTile(isWithinPreviewTile);
        }}
      />
    );

    return (
      <>
        <ShortcutModal
          isOpen={shortcutModalOpen}
          onClose={closeShortcutModal}
          staticId={tool.staticId}
        />
        <PageModal onBack={cancelEditModal} isOpen={showEditModal}>
          <EditTool
            id={tool.staticId}
            topLevel={false}
            onBack={cancelEditModal}
            onUpdate={() => {
              trackAction('update_from_modal');
              setShowEditModal(false);
            }}
            onDelete={() => {
              trackAction('delete_from_modal');
              setShowEditModal(false);
            }}
            editType={editType}
          />
        </PageModal>

        <CustomModal
          onBack={() => {
            trackAction('cancel_modal_run_tool');
            setShowRunModal(false);
          }}
          title="Run snippet"
          isOpen={showRunModal}
        >
          <InteractiveTool
            tool={tool}
            inEditMode={false}
            trackAction={(name) => trackAction(`${name}_from_modal`)}
            onBeforeRun={onBeforeRun}
            onRun={(success) => {
              if (success) {
                onRun?.(success);
                setShowRunModal(false);
              }
            }}
          />
        </CustomModal>
        <div
          css={css`
            /* TODO(kevin): move this to a gap-based spacing component */
            display: flex;
            flex-direction: column;
            gap: 15px;
          `}
        >
          {/* We don't want to lose the component when menuVisible changes, so keep it wrapped in a Tooltip regardless */}
          <ToolPreviewTooltip
            isOpen={tooltipIsOpen}
            onOpenChange={setTooltipIsOpen}
            name={tool.name}
            previewContents={
              !isDemo &&
              status !== ToolRunStatus.error &&
              !menuVisible &&
              previewContents
            }
          >
            {previewTile}
          </ToolPreviewTooltip>
        </div>
      </>
    );
  }
);

export default memo(Tool);
