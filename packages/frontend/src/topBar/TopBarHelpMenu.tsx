import { faHeart, faVideo } from '@fortawesome/pro-solid-svg-icons';

import { MenuItemLink, MenuSection } from '@kenchi/ui/lib/DropdownMenu';

const VIDEOS: [string, string][] = [
  ['Getting Started', 'https://kenchi.com/demo'],
  [
    'Personalize your sidebar',
    'https://www.loom.com/share/657ddf59d56f4cb09b83d0da31711d79',
  ],

  [
    'Keyboard shortcuts',
    'https://www.loom.com/share/78ea2df2a09c4ccf8f3770cd8f94e9de',
  ],

  [
    'Custom shortcuts',
    'https://www.loom.com/share/6cf27b87a995470d9a987b3b407b829a',
  ],
  [
    'Suggest playbooks/snippets',
    'https://www.loom.com/share/eff4e1b1ab1742dabe49c73a2ce974f5',
  ],
  [
    'Add Intercom tags',
    'https://www.loom.com/share/803e711762b8467ba11671515b85b4a8',
  ],
];

export const TopBarHelpMenu = ({
  onOpenKeyboardShortcuts,
  onOpenGetInTouch,
}: {
  onOpenKeyboardShortcuts: () => void;
  onOpenGetInTouch: () => void;
}) => {
  return (
    <>
      <MenuSection title="Videos" icon={faVideo}>
        {VIDEOS.map(([title, url]) => (
          <MenuItemLink key={url} target="_blank" to={url}>
            {title}
          </MenuItemLink>
        ))}
      </MenuSection>
      <MenuSection title="Help" icon={faHeart}>
        <MenuItemLink onClick={onOpenKeyboardShortcuts}>
          Keyboard shortcuts
        </MenuItemLink>
        <MenuItemLink onClick={onOpenGetInTouch}>Get in touch</MenuItemLink>
      </MenuSection>
    </>
  );
};
