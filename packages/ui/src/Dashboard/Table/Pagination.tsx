import { HTMLAttributes } from 'react';

import { css } from '@emotion/react';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import { KenchiTheme } from '../../Colors';

const paginationStyle = ({ colors }: KenchiTheme) => css`
  ${tw`transition-colors cursor-pointer select-none`}
  color: ${colors.accent[9]};

  &:hover {
    color: ${colors.accent[10]};
    text-decoration: none;
  }

  svg {
    ${tw`transition`}
    transform: translateX(0);
  }

  &.left:hover svg {
    transform: translateX(-20%);
  }
  &.right:hover svg {
    transform: translateX(20%);
  }

  &.current,
  &.disabled {
    cursor: default;
    color: ${colors.gray[10]};
  }
`;

type PaginationProps = {
  page: number;
  totalPages: number;
  PaginationLink: (
    params: { page: number } & HTMLAttributes<HTMLElement>
  ) => React.ReactElement;
};

export const Pagination = ({
  page,
  totalPages,
  PaginationLink,
}: PaginationProps) => {
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div
      css={({ colors }) => [
        css`
          border-top: 1px solid ${colors.gray[3]};
        `,
        tw`flex justify-between px-4 py-2 text-sm font-medium`,
      ]}
    >
      <div
        css={({ colors }: KenchiTheme) => css`
          color: ${colors.gray[11]};
        `}
      >
        Page {page} of {totalPages}
      </div>
      <div css={tw`flex gap-2`}>
        {hasPreviousPage ? (
          <PaginationLink page={page - 1} css={paginationStyle}>
            <span className={'left'}>
              <FontAwesomeIcon icon={faChevronLeft} size="sm" /> Previous
            </span>
          </PaginationLink>
        ) : (
          <span className={'disabled'} css={paginationStyle}>
            <FontAwesomeIcon icon={faChevronLeft} size="sm" /> Previous
          </span>
        )}
        {hasNextPage ? (
          <PaginationLink page={page + 1} css={paginationStyle}>
            <span className={'right'}>
              Next <FontAwesomeIcon icon={faChevronRight} size="sm" />
            </span>
          </PaginationLink>
        ) : (
          <span className={'disabled'} css={paginationStyle}>
            Next <FontAwesomeIcon icon={faChevronRight} size="sm" />
          </span>
        )}
      </div>
    </div>
  );
};
