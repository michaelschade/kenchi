import { css } from '@emotion/react';

import {
  FullPageContainer,
  FullPageContentCard,
  FullPageTopBar,
} from '@kenchi/ui/lib/Dashboard/FullPage';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import { ReactComponent as KenchiLogo } from '../logos/wordmark.svg';

export default function RecordStartPage() {
  return (
    <FullPageContainer>
      <FullPageTopBar>
        <KenchiLogo
          css={css`
            width: 8rem;
          `}
        />
      </FullPageTopBar>
      <FullPageContentCard>
        <h1>Let's get recording 🎉</h1>
        <Separator />
        <div
          css={css`
            display: grid;
            padding-top: 0.5rem;
            gap: 1rem;
          `}
        >
          <h2>Time to teach Kenchi about your admin!</h2>

          <div
            css={css`
              max-width: 62ch;
              display: grid;
              gap: 1rem;
              margin: 0 auto;
            `}
          >
            <p>
              This window is now setup as your Magic Kenchi Recorder. That means
              we'll record what you do in order to figure out how your admin
              page works. Think of it like programming a universal remote.
            </p>
            <ol>
              <li>Visit your admin tool</li>
              <li>Search for a user by email address</li>
              <li>Open their page</li>
              <li>Click "done" at the top</li>
            </ol>
            <p>
              Have questions? Want us to walk you through setting things up?
              Email us at{' '}
              <UnstyledLink to="mailto:support@kenchi.com" target="_blank">
                support@kenchi.com
              </UnstyledLink>
              . We're here to help!
            </p>
          </div>
        </div>
      </FullPageContentCard>
    </FullPageContainer>
  );
}
