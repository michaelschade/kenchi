import { useEffect } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';

import {
  FullPageContainer,
  FullPageContentCard,
  FullPageTopBar,
} from '@kenchi/ui/lib/Dashboard/FullPage';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import { linkStyle } from '@kenchi/ui/lib/Text';
import { useToast } from '@kenchi/ui/lib/Toast';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import { Key } from '../components/HotkeysHelp';
import { useExtensionStatus } from '../dashboard/quickstart/useExtensionStatus';
import { InlineApp } from '../demo/InlineApp';
import { ReactComponent as KenchiLogo } from '../logos/wordmark.svg';
import { trackEvent } from '../utils/analytics';
import useMessageRouter from '../utils/useMessageRouter';
import { PostInstallTipPopover } from './PostInstallTipPopover';

const setClipboard = (text: string) => {
  const type = 'text/plain';
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];

  return navigator.clipboard.write(data);
};

const VideoContainer = styled.div`
  position: relative;
  padding-bottom: 61.01%;
  border-radius: 0.5rem;
  overflow: hidden;
  height: 0;

  & > iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

export default function InstalledPage() {
  const { hasExtension, keyboardShortcutsRegistered } = useExtensionStatus();
  const { triggerToast } = useToast();
  const messageRouter = useMessageRouter();

  useEffect(() => {
    if (keyboardShortcutsRegistered !== null) {
      trackEvent({
        action: keyboardShortcutsRegistered
          ? 'shortcuts_registered'
          : 'shortcuts_missing',
        category: 'extension',
      });
    }
  }, [keyboardShortcutsRegistered]);

  useEffect(() => {
    if (hasExtension === false) {
      window.location.href = 'https://get.kenchi.com';
    }
  }, [hasExtension]);

  const shortcutLinkClick = async () => {
    try {
      await messageRouter.sendCommand('background', 'sendToShortcutsPage');
      return;
    } catch (e) {}

    const URL = 'chrome://extensions/shortcuts';
    try {
      await setClipboard(URL);
      triggerToast({
        message: `Copied link to ${URL}, please paste into your URL bar.`,
      });
      return;
    } catch (e) {}

    triggerToast({
      message: `Failed to copy link. Go to ${URL} to set Kenchi keyboard shortcut.`,
    });
  };

  return (
    <>
      <FullPageContainer>
        <FullPageTopBar>
          <KenchiLogo
            css={css`
              width: 8rem;
            `}
          />
        </FullPageTopBar>
        <FullPageContentCard>
          <h1>Kenchi is installed 🎉</h1>
          <Separator />
          <div
            css={css`
              display: grid;
              padding-top: 0.5rem;
              gap: 1rem;
            `}
          >
            <h2>Learn how to get started with Kenchi in this 2-minute video</h2>
            <VideoContainer>
              <iframe
                title="Getting Started with Kenchi"
                src="https://www.loom.com/embed/073f5b8669284f3bac994ffb9d553351?hideEmbedTopBar=true"
                frameBorder="0"
                allowFullScreen
              />
            </VideoContainer>

            <div
              css={css`
                max-width: 62ch;
                display: grid;
                gap: 1rem;
                margin: 0 auto;
              `}
            >
              {!keyboardShortcutsRegistered && (
                <p>
                  To enable the <Key>ctrl</Key> <Key>space</Key> keyboard
                  shortcut for opening Kenchi, go to{' '}
                  <span css={linkStyle} onClick={shortcutLinkClick}>
                    chrome://extensions/shortcuts
                  </span>
                  .
                </p>
              )}
              {keyboardShortcutsRegistered && (
                <p>
                  Tip: You can open Kenchi by pressing <Key>ctrl</Key>{' '}
                  <Key>space</Key> on any page.
                </p>
              )}
              <p>
                Kenchi is most helpful where{' '}
                <span
                  css={css`
                    font-style: italic;
                  `}
                >
                  you
                </span>{' '}
                work. Try it in your support platform, like Intercom, Front,
                Zendesk, or Gmail.
              </p>
              <p>
                Have questions? Email us at{' '}
                <UnstyledLink to="mailto:support@kenchi.com" target="_blank">
                  support@kenchi.com
                </UnstyledLink>
                . We're here to help!
              </p>
            </div>
          </div>
        </FullPageContentCard>
      </FullPageContainer>
      <PostInstallTipPopover />
      <InlineApp />
    </>
  );
}
