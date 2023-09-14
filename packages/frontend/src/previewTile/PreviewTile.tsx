import { forwardRef, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';

import { BaseColors } from '@kenchi/ui/lib/Colors';

import Tags from './Tags';

const shadowTransition = css`
  transition: box-shadow 0.15s ease-in;
`;

const Tile = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.gray[6]};
  background-color: ${({ theme }) => theme.colors.gray[1]};
  line-height: 1;
  position: relative;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 0 0px transparent;
  ${shadowTransition}

  &.active {
    box-shadow: 0 0 0px transparent;
  }

  /* Running = snippet is loading or taking action. */
  &.running {
    opacity: 0.6;
    pointer-events: none;
  }

  &.disabled {
    cursor: default;
  }

  &.error {
    opacity: 1;
    box-shadow: 0px 0px 8px -4px hsla(331, 57%, 63%, 0.77);
    animation: error 6s linear;

    svg.error,
    p.error {
      color: ${BaseColors.error};
    }

    svg.error {
      font-size: 0.9em;
    }

    p.error {
      line-height: 1.3;
      font-size: 0.75em;
    }

    @keyframes error {
      0% {
        transform: translateX(0);
      }
      1% {
        transform: translateX(12px);
      }
      3% {
        transform: translateX(-10px);
      }
      5% {
        transform: translateX(10px);
      }
      7% {
        transform: translateX(-8px);
      }
      9% {
        transform: translateX(6px);
      }
      11% {
        transform: translateX(-4px);
      }
      13% {
        transform: translateX(2px);
      }
      15% {
        transform: translateX(-1px);
      }
      17% {
        transform: translateX(1px);
      }
      19% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(0);
      }
    }
  }

  /* SelectableList adds a .selectable-selected class to the parent. Use that
   * and hover to style selection */
  &:not(.error) {
    .selectable-selected &,
    &:hover {
      text-decoration: none;

      &:not(.active) {
        box-shadow: 0px 0px 8px -4px hsla(210, 3%, 31%, 0.67);
      }
    }

    .selectable-selected &,
    &:hover,
    &.actions-force-show {
      .header {
        flex-shrink: 1;
      }
    }
  }
`;

const Contents = styled.div`
  display: flex;
  width: 100%;
  padding: 5px;

  ${shadowTransition}

  &.active {
    box-shadow: inset 0px 0px 7px -5px hsla(210, 3%, 31%, 0.67);
  }
`;

const Icon = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 22px;
`;

const Column = styled.div`
  margin-left: 5px;
  min-width: 0;
  width: 100%;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow-x: hidden;
`;

const ActionContainer = styled.div`
  flex-shrink: 0;
  margin-left: 2px;
  display: flex;
  gap: 5px;

  button:focus {
    outline: 0;
    box-shadow: none;
  }
`;

const Header = styled.h3`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  height: 20px;
  color: ${({ theme }) => theme.colors.gray[12]};
  padding-top: 1px;

  transition: flex-shrink 0.25s ease-in-out;
  flex-shrink: 0;
  width: 100%;

  &.error {
    color: hsla(331, 5%, 40%, 1);
  }
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.gray[11]};
  margin-bottom: 0;
  font-weight: 400;
  font-size: 0.75em;
  line-height: 1.3;
`;

// Preview Tile is the full container that displays an icon, description, and
// action buttons for various Kenchi objects (specifically Workflows and
// Tools). This manages a lot of interaction state around the selectbale list,
// hovering, which buttons are being clicked, etc.

export type PreviewRef = {
  edit?: () => void;
  exec: () => void;
  open: () => void;
  toggleCollapse?: () => void;
};

type PreviewTileProps = {
  name: React.ReactNode;
  description?: string;
  tags?: React.ReactNode;
  icon: JSX.Element;
  onClick: (e: React.MouseEvent) => void;
  actionEnabled?: boolean;
  actionButtons?: React.ReactElement;
  actionsForceShow?: boolean;
  running?: boolean;
  error?: string | null;
  style?: {};
  className?: string;
} & Pick<
  React.HTMLProps<HTMLDivElement>,
  'onMouseEnter' | 'onMouseLeave' | 'onMouseMove'
>;

const PreviewTile = forwardRef(
  (
    {
      name,
      description,
      tags,
      icon,
      onClick,
      actionEnabled = true,
      actionButtons,
      actionsForceShow = false,
      running = false,
      error = null,
      style = {},
      className,
      ...props
    }: PreviewTileProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [mouseDown, setMouseDown] = useState(false);
    const isActive = running || mouseDown;

    let displayIcon;
    if (error) {
      displayIcon = (
        <FontAwesomeIcon className="error" icon={faExclamationTriangle} />
      );
    } else {
      displayIcon = icon;
    }

    return (
      <Tile
        ref={ref}
        className={classNames(className, {
          active: isActive,
          running,
          disabled: !actionEnabled,
          error: error,
          'actions-force-show': actionsForceShow,
        })}
        style={style}
        {...props}
        onClick={(e) => actionEnabled && onClick(e)}
        onMouseDown={() => actionEnabled && setMouseDown(true)}
        onMouseUp={() => actionEnabled && setMouseDown(false)}
        onMouseOut={() => setMouseDown(false)}
      >
        <Contents className={classNames({ active: isActive })}>
          <Icon>{displayIcon}</Icon>

          <Column>
            <HeaderRow>
              <Header className={classNames('header', { error })}>
                {name}
              </Header>

              {actionButtons && (
                <ActionContainer>{actionButtons}</ActionContainer>
              )}
            </HeaderRow>

            {error && <p className="error">{error}</p>}

            {tags && <Tags>{tags}</Tags>}

            {description?.trim() && <Description>{description}</Description>}
          </Column>
        </Contents>
      </Tile>
    );
  }
);

export default PreviewTile;
