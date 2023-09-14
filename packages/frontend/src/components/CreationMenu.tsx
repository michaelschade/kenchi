import {
  faFileInvoice,
  faLink,
  faMagic,
} from '@fortawesome/pro-solid-svg-icons';

import { MenuItemLink } from '@kenchi/ui/lib/DropdownMenu';

import { trackEvent } from '../utils/analytics';

type Props = {
  analyticsCategory: string;
  collectionId?: string;
};

export default function CreationMenu({
  analyticsCategory,
  collectionId,
}: Props) {
  const track = (type: string) => {
    trackEvent({
      category: analyticsCategory,
      action: `click_creation_menu_new_${type}`,
    });
  };
  const collectionUrlSuffix = collectionId
    ? `?collectionId=${collectionId}`
    : '';
  return (
    <>
      <MenuItemLink
        icon={faMagic}
        to={`/snippets/new${collectionUrlSuffix}`}
        onClick={() => track('snippet')}
      >
        New Snippet
      </MenuItemLink>
      <MenuItemLink
        icon={faFileInvoice}
        to={`/playbooks/new${collectionUrlSuffix}`}
        onClick={() => track('playbook')}
      >
        New Playbook
      </MenuItemLink>
      <MenuItemLink
        icon={faLink}
        to={`/snippets/new${collectionUrlSuffix}${
          collectionUrlSuffix ? '&' : '?'
        }type=link`}
        onClick={() => track('link')}
      >
        New Quick Link
      </MenuItemLink>
    </>
  );
}
