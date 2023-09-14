import { useState } from 'react';

import { css, SerializedStyles } from '@emotion/react';
import { faArrowCircleRight, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';

import { KenchiTheme } from './Colors';

const shadowTransition = css`
  transition: box-shadow 0.25s ease-in, background 0.25s ease-in;
`;

const container = ({ colors }: KenchiTheme) => css`
  position: relative;
  user-select: none;
  width: 100%;
  border-radius: 5px;
  white-space: break-spaces;
  word-break: break-word;

  box-shadow: 0px 0px 3px ${colors.subtleShadow};

  /* Keep the hover effect if the active effect is disabled since we're pressing the dismiss button */
  &.clickable:hover,
  &.clickable.disable-active:active {
    background: linear-gradient(
      254.31deg,
      ${colors.gray[0]} 1.15%,
      ${colors.gray[1]} 99.83%
    );
    box-shadow: 0px 0px 10px rgba(145, 145, 145, 0.2);
  }

  &.clickable {
    ${shadowTransition};
  }

  &.clickable:active {
    box-shadow: 0 0 0px transparent;
  }
`;

const contentContainer =
  (primaryColor: string) =>
  ({ colors }: KenchiTheme) =>
    css`
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: flex-start;
      align-content: flex-start;

      width: 100%;
      padding: 0.5rem;
      padding-right: 1rem;
      background: linear-gradient(
        254.31deg,
        ${colors.gray[0]} 1.15%,
        ${colors.gray[1]} 99.83%
      );
      border: 1px solid ${colors.gray[6]};
      border-radius: 5px;

      &.clickable {
        cursor: pointer;
        ${shadowTransition};
      }

      box-shadow: inset 0 0 0px transparent;

      &.clickable:active:not(.disable-active) {
        background: linear-gradient(
          254.31deg,
          ${colors.gray[0]} 1.15%,
          ${colors.gray[1]} 99.83%
        );
        box-shadow: inset 0px 0px 10px ${colors.subtleShadow};
      }

      .icon {
        min-width: 12px;
        margin-right: 8px;

        .primary,
        .dismiss {
          max-width: 15px;
          transition: color 0.2s ease-in-out, opacity 0.2s ease-in-out;
        }

        .primary {
          color: ${primaryColor};
        }

        .dismiss {
          position: absolute;
          top: 4px;
          right: 6px;
          color: ${colors.gray[8]};
          cursor: pointer;
        }
      }

      &.dismissable:hover {
        .dismiss {
          opacity: 1;

          &:hover {
            color: ${primaryColor};
            opacity: 0.8;
          }

          &:active {
            transition-delay: 0s;
            color: ${primaryColor};
            opacity: 1;
          }
        }
      }
    `;

const content =
  (primaryColor: string) =>
  ({ colors }: KenchiTheme) =>
    css`
      flex-grow: 1;

      .header {
        font-size: 0.9rem;
        font-weight: 600;
        color: ${primaryColor};
        line-height: 1.7rem;
      }

      p {
        font-size: 0.8rem;
        font-weight: 400;
        color: ${colors.gray[11]};
        margin-bottom: 0.5rem;

        svg {
          font-size: 0.7rem;
          color: ${primaryColor};
          margin-left: 0.3em;
        }
      }
    `;

type AlertProps = {
  title: string;
  description: string | React.ReactNode;
  primaryColor: string;
  icon: React.ReactNode;
  containerStyle?: SerializedStyles | SerializedStyles[];
  onClick?: () => void;
  onDismiss?: () => void;
};

export default function Alert({
  title,
  description,
  primaryColor,
  icon,
  containerStyle,
  onClick,
  onDismiss,
}: AlertProps) {
  const [dismissActive, setDismissActive] = useState(false);

  return (
    <div
      css={[container, containerStyle]}
      onClick={onClick}
      className={classNames({
        clickable: onClick,
        'disable-active': dismissActive,
      })}
    >
      <div
        css={contentContainer(primaryColor)}
        className={classNames({
          clickable: onClick,
          dismissable: onDismiss,
          'disable-active': dismissActive,
        })}
      >
        <div className="icon">
          <div className="primary">{icon}</div>
          {onDismiss && (
            <FontAwesomeIcon
              className="dismiss"
              icon={faTimes}
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              onMouseDown={() => setDismissActive(true)}
              onMouseUp={() => setDismissActive(false)}
              onMouseOut={() => setDismissActive(false)}
            />
          )}
        </div>
        <div css={content(primaryColor)}>
          <h1 className="header">{title}</h1>
          <p>
            {description}
            {onClick && (
              <span
                css={css`
                  position: relative;
                `}
              >
                <FontAwesomeIcon
                  icon={faArrowCircleRight}
                  css={css`
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                  `}
                />
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
