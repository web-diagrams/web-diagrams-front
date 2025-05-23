import { Page } from '@/redux/doc/interfaces/docStateInterfaces';
import { useMemo } from 'react';

export const useCurrentPage = (pages: Page[], currentPageId: string) => {
  const currentPage = useMemo(() => {
    if (pages?.length && currentPageId) {
      return pages.find((page) => page.id === currentPageId);
    }
    return null;
  }, [pages, currentPageId]);

  return currentPage;
};
