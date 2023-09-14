import { MemoryHistory } from 'history';
import { act } from 'react-dom/test-utils';

import { render, waitFor } from '../testUtils';
import { useRoutePagination } from './useRoutePagination';

// The use of hooks is restricted to components or other hooks. a simple wrapper
// component is the simplest way around this restriction.
const HookTest = ({
  cb,
  paginationKey,
}: {
  cb: (result: ReturnType<typeof useRoutePagination>) => void;
  paginationKey?: string;
}) => {
  const result = useRoutePagination({ paginationKey });
  cb(result);
  return <div data-testid="result">{JSON.stringify(result)}</div>;
};

const testHook = async ({
  query,
  paginationKey,
}: {
  query?: string;
  paginationKey?: string;
} = {}) => {
  let usePaginationResult = {};
  const queryString = query ? `?${query}` : '';
  const { findByTestId, history } = render(
    <HookTest
      cb={(result) => (usePaginationResult = result)}
      paginationKey={paginationKey}
    />,
    {
      initialPath: `/dashboard/playbooks${queryString}`,
    }
  );
  await findByTestId('result');
  // Yeah, this is a little evil, but I can't think of a good way around it since
  // usePaginationResult isn't const.
  return { ...usePaginationResult, history } as unknown as ReturnType<
    typeof useRoutePagination
  > & { history: MemoryHistory };
};

it('defaults to page 1', async () => {
  const { page } = await testHook();
  expect(page).toEqual(1);
});

it('reads the initial page from query params', async () => {
  const { page } = await testHook({ query: 'page=3' });
  expect(page).toEqual(3);
});

it('returns 1 for page numbers less than 1', async () => {
  const { page } = await testHook({ query: 'page=0' });
  expect(page).toEqual(1);
});

it('returns 1 for page non-numeric page values', async () => {
  const { page } = await testHook({ query: 'page=meow' });
  expect(page).toEqual(1);
});

it('accepts custom page param keys', async () => {
  const { page } = await testHook({
    query: 'pagina=3',
    paginationKey: 'pagina',
  });
  expect(page).toEqual(3);
});

it('updates the URL with setPage', async () => {
  const { setPage, history } = await testHook({ query: 'page=3' });
  act(() => setPage(2));
  await waitFor(() => expect(history.location.search).toBe('?page=2'));
});

it('return a component that renders a page link', async () => {
  const { PaginationLink } = await testHook();
  const { findByRole } = render(<PaginationLink page={5} />);
  const link = await findByRole('link');
  expect(link.getAttribute('href')).toEqual('/dashboard/playbooks?page=5');
});
