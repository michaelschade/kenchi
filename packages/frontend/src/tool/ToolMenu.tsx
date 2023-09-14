import { css } from '@emotion/react';
import { faEye, faPencilAlt } from '@fortawesome/pro-solid-svg-icons';

import { MenuItem, MenuItemLink } from '@kenchi/ui/lib/DropdownMenu';

import {
  BranchTypeEnum,
  ToolListItemFragment as Tool,
} from '../graphql/generated';
import { useHasCollectionPermission } from '../graphql/useSettings';
import CopyLinkMenuItem from '../previewTile/CopyLinkMenuItem';
import ShortcutMenuItem from '../shortcuts/ShortcutMenuItem';
import { ToolMenuRelatedContent } from './ToolMenuRelatedContent';

type Props = {
  tool: Tool;
  onAfterCopyLink: () => void;
  onClickEdit?: (suggest?: boolean) => void;
  onClickOpen?: () => void;
  onOpenModal?: () => void;
  onClickShortcut: () => void;
};

export const ToolMenu = ({
  tool,
  onAfterCopyLink,
  onClickEdit,
  onClickOpen,
  onClickShortcut,
}: Props) => {
  const canPublish = useHasCollectionPermission(
    tool.collection.id,
    'publish_tool'
  );

  if (tool.branchType === BranchTypeEnum.draft && onClickEdit) {
    return (
      <div
        css={css`
          width: 120px;
        `}
      >
        <MenuItem onClick={() => onClickEdit()} icon={faPencilAlt}>
          Edit
        </MenuItem>
        <CopyLinkMenuItem
          onAfterCopyLink={onAfterCopyLink}
          to={`${process.env.REACT_APP_HOST}/dashboard/snippets/${tool.staticId}/branch/${tool.branchId}`}
        />
      </div>
    );
  }

  return (
    <div
      css={css`
        width: 200px;
      `}
    >
      <MenuItemLink
        to={`/snippets/${tool.staticId}`}
        onClick={(event) => {
          if (onClickOpen) {
            event.preventDefault();
            onClickOpen();
          }
        }}
        icon={faEye}
      >
        Preview
      </MenuItemLink>
      <ShortcutMenuItem onClick={onClickShortcut} staticId={tool.staticId} />
      {onClickEdit && canPublish && (
        <MenuItem onClick={() => onClickEdit()} icon={faPencilAlt}>
          Edit
        </MenuItem>
      )}
      {onClickEdit && (
        <MenuItem
          onClick={() => onClickEdit(true)}
          icon={canPublish ? undefined : faPencilAlt}
        >
          Suggest an edit
        </MenuItem>
      )}
      <CopyLinkMenuItem
        onAfterCopyLink={onAfterCopyLink}
        to={`${process.env.REACT_APP_HOST}/dashboard/snippets/${tool.staticId}`}
      />
      <ToolMenuRelatedContent staticId={tool.staticId} />
    </div>
  );
};
