import { css } from '@emotion/react';
import { faAngleDown, faAngleUp } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw, { theme } from 'twin.macro';

import { KenchiTheme } from '../../Colors';
import { HelpIcon } from '../../HelpIcon';

type Sizes = 'sm' | 'md';

const getSize = (size: Sizes) => {
  switch (size) {
    case 'sm':
      return theme('spacing.1');
    case 'md':
      return theme('spacing.2');
    default:
      const missingCase: never = size;
      throw new Error(`Missing case: ${missingCase}`);
  }
};

const tableStyle = ({ colors }: KenchiTheme, size: Sizes = 'md') => css`
  --table-padding-y: ${getSize(size)};

  ${tw`w-full border-collapse`}

  font-size: .875rem;

  > caption {
    caption-side: top;
  }

  > caption:not(:last-child),
  > thead:not(:last-child) > tr:last-of-type:not(.unstyled) > th,
  > thead:not(:last-child) > tr:last-of-type:not(.unstyled) > td,
  > tbody:not(:last-child) > tr:last-of-type:not(.unstyled) > th,
  > tbody:not(:last-child) > tr:last-of-type:not(.unstyled) > td,
  > tfoot:not(:last-child) > tr:last-of-type:not(.unstyled) > th,
  > tfoot:not(:last-child) > tr:last-of-type:not(.unstyled) > td {
    border-bottom: 1px solid ${colors.gray[3]};
  }

  > caption,
  > thead > tr:not(.unstyled) > th,
  > tbody > tr:not(.unstyled) > th,
  > tfoot > tr:not(.unstyled) > th {
    ${tw`px-4 pt-2 pb-1.5 font-semibold text-sm text-left`}
    color: ${colors.gray[10]};

    &.sortable {
      ${tw`whitespace-nowrap cursor-pointer`}
      color: ${colors.accent[9]};

      &:hover {
        color: ${colors.accent[11]};
      }
    }
  }

  > thead > tr:not(.unstyled),
  > tbody > tr:not(.unstyled),
  > tfoot > tr:not(.unstyled) {
    > td {
      ${tw`px-4 align-middle`}
      color: ${colors.gray[12]};
      padding-top: var(--table-padding-y);
      padding-bottom: var(--table-padding-y);

      &.align-top {
        vertical-align: top;
      }

      &.shrink-to-fit {
        width: 1px;
        white-space: nowrap;
      }

      &.no-right-padding {
        padding-right: 0;
      }
    }

    &[onclick] {
      cursor: pointer;
    }
  }

  > tbody > tr:not(.unstyled) {
    & {
      ${tw`transition duration-100`}
    }

    &:not(:last-of-type) {
      border-bottom: 1px solid ${colors.gray[3]};
    }

    &:last-of-type {
      border-bottom: 0px solid ${colors.gray[3]};
    }

    &:hover {
      background-color: ${colors.gray[3]};
    }
  }
`;

export type HeadingData = {
  sortKey?: string;
  value: React.ReactChild;
  align?: 'left' | 'right' | 'center';
  helpText?: string;
  colSpan?: number;
  forCsvOnly?: boolean;
};

type SortDir = 'asc' | 'desc';

export const isSortDir = (dir: unknown): dir is SortDir => {
  return (
    typeof dir === 'string' &&
    (dir.toLocaleLowerCase() === 'asc' || dir.toLocaleLowerCase() === 'desc')
  );
};

export type SortTuple = [string, SortDir];

export const isSortTuple = (sortTuple: unknown): sortTuple is SortTuple => {
  return (
    Array.isArray(sortTuple) &&
    sortTuple.length === 2 &&
    typeof sortTuple[0] === 'string' &&
    (sortTuple[1] === 'asc' || sortTuple[1] === 'desc')
  );
};

type HeadingProps = {
  sort?: SortDir | null;
  onSortChange?: (sort: SortDir) => void;
  sortDisabled?: boolean;
} & Omit<HeadingData, 'sortKey'>;

const Heading = ({
  value,
  sort,
  onSortChange,
  align,
  helpText,
  colSpan,
}: HeadingProps) => {
  // This is a bit ridiculous but it's the only way I could get the
  // provided align style to win the css specificity battle against the
  // text-left style we set by default.
  const alignmentStyle = {
    left: { textAlign: 'left' as const },
    right: { textAlign: 'right' as const },
    center: { textAlign: 'center' as const },
  };
  let sortIcon;
  if (onSortChange) {
    if (sort === null) {
      sortIcon = (
        <FontAwesomeIcon
          css={tw`invisible group-hover:visible`}
          icon={faAngleDown}
        />
      );
    } else {
      sortIcon = (
        <FontAwesomeIcon icon={sort === 'desc' ? faAngleDown : faAngleUp} />
      );
    }
  } else {
    sortIcon = null;
  }
  return (
    <th
      className={onSortChange ? 'sortable group' : ''}
      onClick={
        onSortChange
          ? () => onSortChange?.(sort === 'asc' ? 'desc' : 'asc')
          : undefined
      }
      style={align ? alignmentStyle[align] : undefined}
      css={css`
        white-space: nowrap;
      `}
      colSpan={colSpan}
    >
      {value}
      {helpText && <HelpIcon content={helpText} />} {sortIcon}
    </th>
  );
};

export type ColumnHeading = React.ReactChild | HeadingData;

export const isHeadingData = (
  columnHeading: React.ReactChild | HeadingData
): columnHeading is HeadingData => {
  return (columnHeading as HeadingData).value !== undefined;
};

export type RawTableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  size?: Sizes;
  columnHeadings?: ColumnHeading[] | React.ReactNode;
  sort?: SortTuple;
  sortDisabled?: boolean;
  onSortChange?: (sort: SortTuple) => void;
  emptyState?: React.ReactNode;
};

export const RawTable = ({
  children,
  columnHeadings,
  sort,
  onSortChange,
  sortDisabled,
  size = 'md',
  ...props
}: RawTableProps) => {
  let heading: React.ReactNode = null;
  if (Array.isArray(columnHeadings)) {
    heading = (
      <tr>
        {columnHeadings.map((h, i) => {
          if (!isHeadingData(h)) {
            return <th key={i}>{h}</th>;
          }
          if (h.forCsvOnly) {
            return null;
          }
          const { sortKey, ...props } = h;
          const canSort = sortKey && !sortDisabled;
          return (
            <Heading
              key={i}
              sort={canSort && sort?.[0] === sortKey ? sort[1] : null}
              onSortChange={
                canSort ? (dir) => onSortChange?.([sortKey, dir]) : undefined
              }
              {...props}
            />
          );
        })}
      </tr>
    );
  } else if (columnHeadings) {
    heading = columnHeadings;
  }
  return (
    <table css={(theme: KenchiTheme) => tableStyle(theme, size)} {...props}>
      {heading && <thead css={tw`select-none`}>{heading}</thead>}
      {children}
    </table>
  );
};
