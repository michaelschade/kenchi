import { faLink } from '@fortawesome/pro-solid-svg-icons';

import { MenuItem } from '@kenchi/ui/lib/DropdownMenu';

import { useClipboardWriter } from '../utils/useClipboardWriter';

export default function CopyLinkMenuItem({
  to,
  onAfterCopyLink,
}: {
  to: string;
  onAfterCopyLink: () => void;
}) {
  const copyLinkClipboard = useClipboardWriter();

  return (
    <MenuItem
      onClick={(event) => {
        // preventDefault() here makes it so clicking the menu item doesn't
        // close the menu. We want to flash some text to confirm that the link
        // was copied.
        event.preventDefault();
        copyLinkClipboard.write(to);
        setTimeout(onAfterCopyLink, 1000);
      }}
      icon={faLink}
    >
      {copyLinkClipboard.state === 'idle' ? 'Copy link' : null}
      {copyLinkClipboard.state === 'pending' ? 'Copying…' : null}
      {copyLinkClipboard.state === 'success' ? 'Link copied!' : null}
      {copyLinkClipboard.state === 'error' ? 'Could not copy link' : null}
    </MenuItem>
  );
}
