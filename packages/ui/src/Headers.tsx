import { CSSProperties, MouseEvent } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { KenchiTheme } from './Colors';
import Tooltip from './Tooltip';

export const HEADER_HEIGHT_PX = 40;

export const HeaderBar = styled(
  ({
    className,
    children,
  }: {
    className?: string;
    children: React.ReactNode;
  }) => <div className={`header-bar ${className || ''}`}>{children}</div>
)`
  background-color: ${({ theme }) => theme.colors.gray[1]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[6]};
  color: ${({ theme }) => theme.colors.gray[12]};
  width: 100%;
  min-height: ${HEADER_HEIGHT_PX}px;
  padding: 0 10px;

  display: flex;
  gap: 0.5rem;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;

  > * {
    flex-shrink: 1;
  }

  h1,
  h2 {
    flex-shrink: 1;
  }
`;

export const SectionHeader = styled.h2`
  & span {
    background: ${({ theme }) => theme.colors.extensionSectionHeader};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

export const Eyebrow = styled.h3`
  --fontSize: 0.7em;
  font-family: 'Neue Machina';
  font-size: var(--fontSize);
  line-height: calc(22 / 16);
  text-transform: uppercase;
  letter-spacing: calc(var(--fontSize) * 0.05);
  color: ${({ theme }) => theme.colors.gray[10]};
`;

const iconLink = ({ colors }: KenchiTheme) => css`
  position: relative;
  color: ${colors.accent[8]};
  transition: color 0.2s ease-in-out;
  background: none;
  border: none;
  padding: 0;
  outline: none;

  &:hover,
  &:focus {
    color: ${colors.accent[9]};
  }
`;

type HeaderIconLinkProps = {
  onClick: (e: MouseEvent) => void;
  icon: IconProp;
  size?: SizeProp;
  style?: CSSProperties;
  title?: string;
};

export function HeaderIconLink({
  onClick,
  icon,
  size = 'sm',
  title,
}: HeaderIconLinkProps) {
  let iconElem = (
    <FontAwesomeIcon icon={icon} size={size} style={{ cursor: 'pointer' }} />
  );
  if (title) {
    iconElem = (
      <Tooltip placement="left" overlay={title}>
        {iconElem}
      </Tooltip>
    );
  }
  return (
    <button onClick={onClick} css={iconLink}>
      {iconElem}
    </button>
  );
}
