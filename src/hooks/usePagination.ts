import { useState, useCallback } from 'react';
import { PaginationParams, UsePaginationOptions, UsePaginationReturn } from '@/types/pagination/pagination';

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialSortBy = 'createdAt',
    initialSortOrder = 'desc',
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [search, setSearchState] = useState(initialSearch);
  const [sortBy, setSortByState] = useState(initialSortBy);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(initialSortOrder);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1); // Reset to first page when changing limit
  }, []);

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
    setPageState(1); // Reset to first page when searching
  }, []);

  const setSortBy = useCallback((newSortBy: string) => {
    setSortByState(newSortBy);
    setPageState(1); // Reset to first page when changing sort
  }, []);

  const setSortOrder = useCallback((newSortOrder: 'asc' | 'desc') => {
    setSortOrderState(newSortOrder);
    setPageState(1); // Reset to first page when changing sort order
  }, []);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setLimitState(initialLimit);
    setSearchState(initialSearch);
    setSortByState(initialSortBy);
    setSortOrderState(initialSortOrder);
  }, [initialPage, initialLimit, initialSearch, initialSortBy, initialSortOrder]);

  const getParams = useCallback((): PaginationParams => {
    const params: PaginationParams = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    return params;
  }, [page, limit, search, sortBy, sortOrder]);

  return {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSearch,
    setSortBy,
    setSortOrder,
    reset,
    getParams,
  };
}