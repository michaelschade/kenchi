import { useEffect } from 'react';

import { css } from '@emotion/react';
import { faCircleNotch } from '@fortawesome/pro-solid-svg-icons';
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import * as Sentry from '@sentry/minimal';

import { KenchiTheme } from './Colors';
import { HeaderBar } from './Headers';

const spinner = (theme: KenchiTheme) => css`
  animation: fa-spin 2s linear infinite;
  color: ${theme.colors.gray[8]};
`;

type Props = {
  // Optional name to help in debugging
  name?: string;
  // Expected loading time (in ms), will trigger Sentry message if over this
  // amount (defaults to 5s)
  timeout?: number;
};

type IconProps = Omit<FontAwesomeIconProps, 'icon'>;

export function LoadingSpinner({
  name,
  timeout = 5_000,
  ...iconProps
}: Props & IconProps) {
  useEffect(() => {
    if (!name) {
      return;
    }
    const timer = setTimeout(() => {
      // captureMessage didn't seem to log a stacktrace, so I'm trying out
      // captureException instead
      Sentry.captureException(
        new Error('Detected long-running loading spinner'),
        {
          extra: {
            spinnerName: name,
            spinnerTimeout: timeout,
          },
        }
      );
    }, timeout);
    return () => clearTimeout(timer);
  }, [name, timeout]);

  return (
    <FontAwesomeIcon
      icon={faCircleNotch}
      size="sm"
      title="Loading…"
      css={spinner}
      {...iconProps}
    />
  );
}

export default function Loading(props: Props) {
  return (
    <HeaderBar>
      <LoadingSpinner {...props} />
    </HeaderBar>
  );
}
