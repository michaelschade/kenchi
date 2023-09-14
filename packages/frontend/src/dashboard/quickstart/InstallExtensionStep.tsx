import React, { useEffect, useRef } from 'react';

import { css } from '@emotion/react';

import { PrimaryButton } from '@kenchi/ui/lib/Button';

import { trackEvent } from '../../utils/analytics';
import { NextStepLink } from './NextStepLink';
import { useQuickstartStatus } from './useQuickstartStatus';

export const InstallExtensionStep = ({
  onClickCelebrate,
}: {
  onClickCelebrate: () => void;
}) => {
  const { hasExtension } = useQuickstartStatus();
  const hadExtension = useRef(hasExtension);

  useEffect(() => {
    trackEvent({
      category: 'quickstart',
      action: 'open_install_extension',
    });
  }, []);

  useEffect(() => {
    if (!hadExtension.current && hasExtension) {
      trackEvent({
        category: 'quickstart',
        action: 'complete_install_extension',
      });
    }
  }, [hasExtension]);
  return (
    <div
      css={css`
        display: grid;
        gap: 1rem;

        p {
          margin: 0;
        }
      `}
    >
      <p>
        Our browser extension sits on top of your existing support
        platforms&mdash;Intercom, Salesforce, Zendesk, you name it&mdash;to
        bring playbooks and snippets right to your sidebar. It's a bit magical,
        so the best way to see is by trying:
      </p>
      <div>
        <PrimaryButton
          disabled={!!hasExtension}
          onClick={() => window.open('https://get.kenchi.com')}
        >
          {hasExtension ? 'Kenchi is installed! 🎉' : 'Add Kenchi to Chrome'}
        </PrimaryButton>
      </div>
      {hasExtension && <NextStepLink onClickCelebrate={onClickCelebrate} />}
    </div>
  );
};
