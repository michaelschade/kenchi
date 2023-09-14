import { useEffect } from 'react';

import { css, SerializedStyles } from '@emotion/react';
import { faBell } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';

import { trackEvent } from '../utils/analytics';

export const ringAnimation = css`
  animation: ring 10s ease-in-out 1s 2;

  @keyframes ring {
    0% {
      transform: rotate(0);
    }
    1% {
      transform: rotate(12deg);
    }
    3% {
      transform: rotate(-10deg);
    }
    5% {
      transform: rotate(10deg);
    }
    7% {
      transform: rotate(-8deg);
    }
    9% {
      transform: rotate(6deg);
    }
    11% {
      transform: rotate(-4deg);
    }
    13% {
      transform: rotate(2deg);
    }
    15% {
      transform: rotate(-1deg);
    }
    17% {
      transform: rotate(1deg);
    }
    19% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(0);
    }
  }
`;

type NotificationProps = {
  title: string;
  description: React.ReactNode;
  onClick?: () => void;
  onDismiss?: () => void;
  style?: SerializedStyles;
  icon?: React.ReactNode;
  primaryColor?: string;
};

export function NotificationAlert({
  title,
  description,
  onClick,
  onDismiss,
  style,
  icon,
  primaryColor,
}: NotificationProps) {
  useEffect(() => {
    trackEvent({ category: 'notifications', action: 'show', label: title });
  }, [title]);

  const open = onClick
    ? () => {
        trackEvent({ category: 'notifications', action: 'open', label: title });
        onClick();
      }
    : undefined;

  const dismiss = onDismiss
    ? () => {
        trackEvent({
          category: 'notifications',
          action: 'dismiss',
          label: title,
        });
        onDismiss();
      }
    : undefined;

  return (
    <Alert
      title={title}
      description={description}
      onClick={open}
      onDismiss={dismiss}
      icon={icon || <FontAwesomeIcon icon={faBell} css={ringAnimation} />}
      containerStyle={style}
      primaryColor={primaryColor || BaseColors.info}
    />
  );
}
