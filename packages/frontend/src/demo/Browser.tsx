import { css } from '@emotion/react';
import {
  faChevronLeft,
  faChevronRight,
  faEllipsisV,
  faLock,
  faRedoAlt,
  faUserCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';

type Props = {
  children: React.ReactNode;
  compact?: boolean;
  hostname: string;
};

const style = ({ colors }: KenchiTheme) => css`
  position: relative;
  width: 100%;
  height: 100%;

  .browser-nav {
    background-color: ${colors.gray[4]};
    color: ${colors.gray[11]};
    border-color: ${colors.gray[6]};
    ${tw`px-3 py-1 flex gap-6 text-xs justify-between border-0 border-b border-solid`}
  }

  .browser-bottom {
    ${tw`inset-0 ring-1 ring-black ring-opacity-5 rounded transition`}
  }

  &:not(.compact) {
    .browser-viewport {
      height: calc(100vh - 29px);
    }
  }

  &.compact {
    pointer-events: none;
    select: none;

    .browser-bottom {
      position: absolute;
      ${tw`shadow-soft group-hover:shadow-soft-md`}
    }
  }
`;

export const Browser = ({ children, compact, hostname }: Props) => (
  <div css={style} className={classNames({ compact })}>
    <div css={tw`rounded overflow-hidden w-full h-full`}>
      <div className="browser-nav">
        {!compact && (
          <>
            <div css={tw`flex items-center justify-center gap-4`}>
              <FontAwesomeIcon icon={faChevronLeft} />
              <FontAwesomeIcon icon={faChevronRight} />
              <FontAwesomeIcon icon={faRedoAlt} />
            </div>
            <div
              css={[
                tw`flex-grow bg-white rounded-xl px-3 flex items-center gap-3`,
                compact ? tw`py-1` : tw`py-0.5`,
              ]}
            >
              <FontAwesomeIcon icon={faLock} size="xs" />
              {hostname}
            </div>
            <div css={tw`flex items-center justify-center gap-4`}>
              <FontAwesomeIcon icon={faUserCircle} />
              <FontAwesomeIcon icon={faEllipsisV} />
            </div>
          </>
        )}
      </div>
      <div className="browser-viewport">{children}</div>
    </div>
    <div className="browser-bottom" />
  </div>
);
