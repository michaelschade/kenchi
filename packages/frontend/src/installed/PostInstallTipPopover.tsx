import { useEffect, useState } from 'react';

import { css, useTheme } from '@emotion/react';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Popover } from '@kenchi/ui/lib/Popover';

import { ReactComponent as PuzzleIcon } from '../icons/chromePuzzle.svg';
import pinKenchiExtension from '../images/pin-kenchi-extension.png';

export const PostInstallTipPopover = ({}) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsOpen(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);
  const {
    colors: { gray },
  } = useTheme();

  const popoverContent = (
    <div
      css={css`
        padding: 0.5rem;
        display: grid;
        gap: 0.5rem;
        color: ${gray[12]};
        width: 24.9rem;
        p {
          font-size: 0.9rem;
          margin: 0;
        }
      `}
    >
      <p>
        Click the{' '}
        <PuzzleIcon
          css={css`
            width: 16px;
            padding-bottom: 4px;
          `}
          fill={gray[11]}
        />{' '}
        button above to pin Kenchi for easy access
      </p>
      <div
        css={css`
          padding: 0 0.25rem 0.25rem 0;
        `}
      >
        <img
          css={({ colors }: KenchiTheme) => css`
            width: 100%;
            border: 1px solid ${colors.gray[7]};
            border-radius: 0.25rem;
            box-shadow: 0.25rem 0.25rem 0 0 ${colors.gray[7]};
          `}
          src={pinKenchiExtension}
          alt="screenshot of how to pin Kenchi extension"
        />
      </div>
    </div>
  );

  return (
    <Popover
      isOpen={isOpen}
      align="end"
      onOpenChange={setIsOpen}
      content={popoverContent}
      shouldFocusOnOpen={false}
      shouldShowClose={true}
      shouldShowArrow={true}
      anchorCss={css`
        position: fixed;
        top: 4px;
        right: 102px;
      `}
    />
  );
};
