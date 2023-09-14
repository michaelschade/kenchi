import { useEffect } from 'react';

export type MetaProps = {
  title?: string;
};

export const useMeta = ({ title }: MetaProps) => {
  useEffect(() => {
    if (title == null) return;
    const previousTitle = document.title;
    document.title = `${title} - Kenchi`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
