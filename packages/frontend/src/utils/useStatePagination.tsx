import { useState } from 'react';

import { PaginationLinkElement, SetPage } from './paginationTypes';

export const defaultPaginationParam = 'page';
export function useStatePagination(): [number, SetPage, PaginationLinkElement] {
  const [page, setPageState] = useState(1);

  const setPage = (pageNumber: number): void => {
    setPageState(pageNumber);
  };

  const PaginationLink: PaginationLinkElement = ({ page, ...props }) => (
    <span
      onClick={(e) => {
        e.preventDefault();
        setPage(page);
      }}
      {...props}
    />
  );

  return [page, setPage, PaginationLink];
}
