import { HTMLAttributes } from 'react';

export type SetPage = (page: number) => void;
export type PaginationLinkElement = (
  params: { page: number } & HTMLAttributes<HTMLElement>
) => React.ReactElement;
