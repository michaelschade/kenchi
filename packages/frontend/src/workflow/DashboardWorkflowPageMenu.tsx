import { faArchive, faEllipsisH } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { SecondaryButton } from '@kenchi/ui/lib/Button';
import { MenuItem, MenuOpener } from '@kenchi/ui/lib/DropdownMenu';

type DashboardWorkflowPageMenuProps = {
  onClickDelete: () => void;
};

export const DashboardWorkflowPageMenu = ({
  onClickDelete,
}: DashboardWorkflowPageMenuProps) => {
  return (
    <MenuOpener
      menuContent={
        <MenuItem icon={faArchive} onClick={onClickDelete}>
          Archive playbook
        </MenuItem>
      }
    >
      <SecondaryButton>
        <FontAwesomeIcon size="sm" icon={faEllipsisH} />
      </SecondaryButton>
    </MenuOpener>
  );
};
