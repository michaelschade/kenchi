import { HTMLAttributes } from 'react';

import styled from '@emotion/styled';
import tw from 'twin.macro';

import { Pagination } from './Pagination';
import { RawTable, RawTableProps } from './RawTable';

export const EmptyStateContainer = styled.div`
  ${tw`p-8 text-center`}
  color: ${({ theme }) => theme.colors.gray[11]};
`;

type Props<T> = {
  data: T[];
  page?: number;
  PaginationLink?: (
    params: { page: number } & HTMLAttributes<HTMLElement>
  ) => React.ReactElement;
  emptyState?: React.ReactNode;
  rowsPerPage?: number;
  rowRender?: (row: T, i: number) => React.ReactNode;
  rowComponent?: React.ComponentType<{ data: T }>;
  showUselessPagination?: boolean;
} & Omit<RawTableProps, 'children'>;

export const PreloadedTable = <T,>({
  data,
  page,
  PaginationLink,
  emptyState,
  rowsPerPage = 20,
  rowRender,
  rowComponent,
  columnHeadings,
  onSortChange,
  showUselessPagination = true,
  ...tableProps
}: Props<T>) => {
  const isEmpty = !data.length;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const currentPage = Math.min(page || 1, totalPages);
  const rowData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  let rows;
  if (rowRender) {
    if (rowComponent) {
      throw new Error('Must only provide one of rowRender or rowComponent');
    }
    rows = rowData.map((row, i) => rowRender(row, i));
  } else if (rowComponent) {
    const RowComponent = rowComponent;
    rows = rowData.map((row, i) => <RowComponent key={i} data={row} />);
  } else {
    throw new Error('Must provide one of rowRender or rowComponent');
  }

  return (
    <>
      <RawTable
        columnHeadings={columnHeadings}
        sortDisabled={isEmpty}
        onSortChange={(sort) => {
          onSortChange?.(sort);
        }}
        {...tableProps}
      >
        <tbody>{rows}</tbody>
      </RawTable>
      {isEmpty &&
        (emptyState ? (
          emptyState
        ) : (
          <EmptyStateContainer>No items to display.</EmptyStateContainer>
        ))}
      {!isEmpty &&
        (showUselessPagination || totalPages > 1) &&
        PaginationLink && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            PaginationLink={PaginationLink}
          />
        )}
    </>
  );
};
