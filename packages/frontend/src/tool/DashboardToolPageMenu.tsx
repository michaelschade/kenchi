import { faArchive, faEllipsisH } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { SecondaryButton } from '@kenchi/ui/lib/Button';
import { MenuItem, MenuOpener } from '@kenchi/ui/lib/DropdownMenu';

type DashboardToolPageMenuProps = {
  onClickDelete: () => void;
};

export const DashboardToolPageMenu = ({
  onClickDelete,
}: DashboardToolPageMenuProps) => {
  return (
    <MenuOpener
      menuContent={
        <MenuItem icon={faArchive} onClick={onClickDelete}>
          Archive snippet
        </MenuItem>
      }
    >
      <SecondaryButton>
        <FontAwesomeIcon size="sm" icon={faEllipsisH} />
      </SecondaryButton>
    </MenuOpener>
  );
};
