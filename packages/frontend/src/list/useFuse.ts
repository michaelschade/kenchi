import { useMemo } from 'react';

import Fuse from 'fuse.js';

// It seems fuse doesn't export FuseResult so we define our own limited version of it here
export type FuseResult<T> = {
  item: T;
  score: number;
};

type Options<T> = {
  keys?: (
    | string
    | { name: string; weight?: number }
    | { name: string; getFn: (item: T) => string; weight?: number }
  )[];
  limit?: number;
};

export default function useFuse<T>(
  items: T[] | null,
  searchValue?: string,
  options?: Options<T>
): FuseResult<T>[] {
  const { limit = 20, keys = ['name', 'keywords', 'description'] } =
    options || {};
  const fuse = useMemo(() => {
    if (!items) {
      return;
    }
    return new Fuse(items, {
      distance: 100,
      includeScore: true,
      keys,
      location: 0,
      minMatchCharLength: 1,
      threshold: 0.6,
    });
  }, [items, keys]);
  return useMemo(() => {
    // We must reshape our default results to match the FuseResult shape when
    // there is no search value: https://github.com/krisk/Fuse/issues/229#issuecomment-441907010
    if (!searchValue || !fuse) {
      let rawResult;
      if (items && limit) {
        rawResult = items.slice(0, limit);
      } else {
        rawResult = items || [];
      }
      return rawResult.map((item) => ({
        item,
        score: 1,
      }));
    } else {
      // The typing here gives `score: number | undefined`, but will always be
      // set because we pass `includeScore`.
      return fuse.search(searchValue, { limit }) as FuseResult<T>[];
    }
  }, [fuse, searchValue, items, limit]);
}
