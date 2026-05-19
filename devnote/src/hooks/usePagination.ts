import { useCallback, useMemo, useState } from 'react';

export type PaginationItem = number | '...';

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

interface UsePaginationOptions<T> {
  items: T[];
  itemsPerPage: number;
  resetKey?: string;
}

export function usePagination<T>({
  items,
  itemsPerPage,
  resetKey = 'default',
}: UsePaginationOptions<T>) {
  const [pageState, setPageState] = useState({ page: 1, resetKey });

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const requestedPage = pageState.resetKey === resetKey ? pageState.page : 1;
  const safeCurrentPage = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;

  const setCurrentPage = useCallback(
    (page: number) => {
      setPageState({
        page,
        resetKey,
      });
    },
    [resetKey],
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, itemsPerPage, safeCurrentPage]);

  const paginationItems = useMemo(
    () => getPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );

  return {
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    paginatedItems,
    paginationItems,
    hasPreviousPage: safeCurrentPage > 1,
    hasNextPage: safeCurrentPage < totalPages,
  };
}
