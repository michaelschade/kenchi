import { MouseEvent, ReactNode, useEffect } from 'react';

import { css } from '@emotion/react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Dialog, DialogProps } from '@kenchi/ui/lib/Dialog';
import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import { useHotkeyRegion } from '@kenchi/ui/lib/useHotkey';

const modalStyle = css`
  margin-left: 0;
  margin-right: 0;

  .header-bar {
    border-radius: 4px 4px 0 0;
    background: rgba(242, 248, 255, 1);
    z-index: 100;
  }
`;

type ModalProps = { onBack: () => void; children: ReactNode; isOpen: boolean };

const useRegionOnOpen = (isOpen: boolean) => {
  const enterRegion = useHotkeyRegion();
  useEffect(() => {
    if (isOpen) {
      return enterRegion();
    }
  }, [isOpen, enterRegion]);
};

export function PageModal({ onBack, children, isOpen }: ModalProps) {
  useRegionOnOpen(isOpen);
  return (
    <Dialog isOpen={isOpen} onClose={onBack} width="extension">
      <div
        css={[
          ({ colors }: KenchiTheme) => css`
            background-color: ${colors.accent[1]};
          `,
          modalStyle,
        ]}
      >
        {children}
      </div>
    </Dialog>
  );
}

type CustomModalProps = ModalProps & {
  title: string;
  titleButtonIcon?: IconProp;
  titleButtonOnClick?: (e: MouseEvent) => void;
  isOpen: boolean;
  width?: DialogProps['width'];
};

export function CustomModal({
  onBack,
  title,
  titleButtonIcon = undefined,
  titleButtonOnClick = undefined,
  children,
  isOpen,
  width = 'extension',
}: CustomModalProps) {
  useRegionOnOpen(isOpen);
  return (
    <Dialog isOpen={isOpen} onClose={onBack} width={width}>
      <div
        css={[
          ({ colors }: KenchiTheme) => css`
            background-color: ${colors.accent[1]};
          `,
          modalStyle,
        ]}
      >
        <HeaderBar>
          <HeaderIconLink
            icon={faArrowLeft}
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
          />

          <SectionHeader>{title}</SectionHeader>

          {titleButtonIcon && titleButtonOnClick && (
            <HeaderIconLink
              onClick={titleButtonOnClick}
              icon={titleButtonIcon}
            />
          )}
        </HeaderBar>

        <ContentContainer>{children}</ContentContainer>
      </div>
    </Dialog>
  );
}
