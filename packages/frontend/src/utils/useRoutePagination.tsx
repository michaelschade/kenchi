import { useCallback, useEffect, useMemo } from 'react';

import { parse } from 'qs';
import { Link, useHistory, useLocation } from 'react-router-dom';

import buildQuery from './buildQuery';
import { PaginationLinkElement, SetPage } from './paginationTypes';
import { useQueryParams } from './useQueryParams';

export const defaultPaginationParam = 'page';

export function useRoutePagination({
  paginationKey = defaultPaginationParam,
}: { paginationKey?: string } = {}): {
  page: number;
  setPage: SetPage;
  PaginationLink: PaginationLinkElement;
} {
  const location = useLocation();
  const history = useHistory();
  const [queryParams, setQueryParams] = useQueryParams();
  const page = useMemo(() => {
    const pageValue = Number(queryParams[paginationKey] || 1);
    return pageValue < 1 ? NaN : pageValue;
  }, [queryParams, paginationKey]);

  // Transition to page 1 for invalid page values like page=-1 or page=kitten
  useEffect(() => {
    if (isNaN(page)) {
      history.replace(paginatedPageLocation(1));
    }
  });

  const setPage = useCallback(
    (pageNumber: number) => {
      const queryPageNumber = pageNumber === 1 ? undefined : pageNumber;
      setQueryParams(
        { [paginationKey]: queryPageNumber?.toString() },
        { shouldReplaceState: true }
      );
    },
    [paginationKey, setQueryParams]
  );

  const paginatedPageLocation = (pageNumber: number) => {
    return {
      ...location,
      // Remove page from the query string for page 1
      search: buildQuery(parse(location.search, { ignoreQueryPrefix: true }), {
        [paginationKey]: pageNumber > 1 ? pageNumber.toString() : undefined,
      }),
    };
  };

  const PaginationLink: PaginationLinkElement = ({ page, ...props }) => (
    <Link to={paginatedPageLocation(page)} {...props} />
  );

  return { page, setPage, PaginationLink };
}
