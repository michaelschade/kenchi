import { useCallback, useState } from 'react';

import { css } from '@emotion/react';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { useGlobalHotkey } from '@kenchi/ui/lib/useHotkey';

import UserSettings from '../settings/UserSettings';
import { trackEvent } from '../utils/analytics';
import Confetti, { TIMEOUT } from './Confetti';
import Feedback from './Feedback';
import HotkeysHelp from './HotkeysHelp';
import { CustomModal, PageModal } from './Modals';

const wrapper = ({ colors }: KenchiTheme) => css`
  /* --footer-height defined in App.tsx */
  height: var(--footer-height);
  position: absolute;
  bottom: 0;
  width: 100%;

  text-align: center;
  padding: 10px;
  box-shadow: inset 0 5px 10px -5px ${colors.subtleShadow};
  background: linear-gradient(
    217deg,
    ${colors.accent[11]},
    ${colors.accent[12]} 110.71%
  );

  ul {
    padding-left: 0px;
    margin-bottom: 0;
    font-size: 0.7em;
    line-height: 1.75;
  }

  ul li {
    display: inline;

    &:not(:first-of-type) {
      padding-left: 10px;
    }

    span {
      cursor: pointer;
    }
  }

  li > a,
  li > span {
    color: ${colors.accent[5]};
    display: inline-block;
  }

  li > a:hover,
  li > span:hover {
    font-weight: 600;
    text-decoration: none;
  }

  /* Prevents items from shifting when bolding */
  li > a::before,
  li > span::before {
    display: block;
    content: attr(data-text);
    font-weight: bold;
    height: 0;
    overflow: hidden;
    visibility: hidden;
  }
`;

const confetti = css`
  filter: grayscale(1);

  &:hover {
    filter: none;
  }
}
`;

export default function Footer() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const doConfetti = useCallback(() => {
    if (!showConfetti) {
      setShowConfetti(true);
      window.setTimeout(() => setShowConfetti(false), TIMEOUT);
    }
  }, [showConfetti]);

  const openShortcutsHelp = useCallback(() => {
    setShowShortcuts(true);
    trackEvent({
      category: 'shortcuts',
      action: 'open_modal_guide',
      label: 'Open shortcuts guide',
    });
  }, []);

  useGlobalHotkey('?', openShortcutsHelp);

  const closeShortcutsHelp = () => {
    setShowShortcuts(false);
    trackEvent({
      category: 'shortcuts',
      action: 'close_modal_guide',
      label: 'Close shortcuts guide',
    });
  };

  const closeSettings = () => {
    setShowSettings(false);
    trackEvent({
      category: 'settings',
      action: 'close_modal',
      label: 'Close settings',
    });
  };

  return (
    <div css={wrapper}>
      <Feedback />

      <Confetti render={showConfetti} />

      <CustomModal
        isOpen={showShortcuts}
        onBack={closeShortcutsHelp}
        title="Guide to Keyboard Shortcuts"
      >
        <HotkeysHelp />
      </CustomModal>

      <PageModal isOpen={showSettings} onBack={closeSettings}>
        <UserSettings onBack={closeSettings} />
      </PageModal>

      <ul>
        <li>
          <span
            data-text="🎉"
            onClick={doConfetti}
            id="confetti"
            css={confetti}
          >
            Made with ❤️ in CA, CO, CT, and NY 🎉
          </span>
        </li>
      </ul>
    </div>
  );
}
