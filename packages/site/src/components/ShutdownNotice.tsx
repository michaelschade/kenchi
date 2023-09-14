import React from 'react';

import { css } from '@emotion/react';
import { useLocalStorage } from '@rehooks/local-storage';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';

const containerStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;

  backdrop-filter: blur(2px);
  background-color: rgba(255, 255, 255, 0.2);
  color: ${BrandColors.white};
`;

const modalStyle = css`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100vw - 25%);
  max-width: 900px;

  background: ${BrandColors.black};
  box-shadow: 0px 0px 2rem -0.5rem hsl(300deg 58% 5% / 30%);
  border-radius: 0.5rem;
  padding: 4rem 3rem;

  ${Breakpoints.medium} {
    width: calc(100vw - 15%);
    padding: 4rem;
  }

  ${Breakpoints.small} {
    width: calc(100vw - 10%);
    padding: 3rem 2rem;
  }

  display: grid;
  place-content: center;
  place-items: start;
  row-gap: 1.25rem;
  overflow: hidden;

  h1 {
    line-height: 1;
    ${Breakpoints.medium} {
      br,
      br:after {
        content: ' ';
      }
    }
    ${Breakpoints.small} {
      line-height: 1.2;
    }
  }

  /* Animate underline for CTA <a> */
  a,
  a:hover,
  a:visited {
    color: ${BrandColors.white};
    text-decoration: underline;
  }
`;

const closeButtonStyle = css`
  position: absolute;
  top: 1.25rem;
  right: 1rem;
  width: 1rem;
  height: 1.5rem;

  color: ${BrandColors.white} !important;
  font-weight: 200;
  transform: scale(1.5);
  cursor: pointer;
  user-select: none;

  display: grid;
  place-content: center;

  ${Breakpoints.medium} {
    top: 1rem;
    right: 0.75rem;
  }

  ${Breakpoints.small} {
    top: 0.75rem;
    right: 0.5rem;
    transform: scale(1.25);
  }
`;

const CloseButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div css={closeButtonStyle} className="eyebrow" onClick={onClick}>
      X
    </div>
  );
};

const ShutdownNotice = () => {
  const [dismissed, setDismissed] =
    useLocalStorage<Boolean>('shutdownDismissed');
  if (dismissed) {
    return null;
  }
  return (
    <div css={containerStyle}>
      <div css={modalStyle}>
        <CloseButton onClick={() => setDismissed(true)} />
        <h1>Kenchi is shutting down</h1>
        <p>
          We've made the difficult decision to close down Kenchi. We will keep
          Kenchi operational through February 2023 to provide transition time.
        </p>
        <p>
          For existing customers, we will work with you 1:1 to export your data
          in your preferred format and help import it into new systems. Once
          exported, all data will be permanently deleted from Kenchi for your
          privacy.
        </p>
        <p>
          We remain incredibly grateful to our early customers, team, investors,
          and friends and family. While we couldn't make Kenchi work as a
          business, we're proud of what we built and your support means the
          world. You can get ahold of us at{' '}
          <a href="mailto:support@kenchi.com">support@kenchi.com</a>.
        </p>
      </div>
    </div>
  );
};

export default ShutdownNotice;
