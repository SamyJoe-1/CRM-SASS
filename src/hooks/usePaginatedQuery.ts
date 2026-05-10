import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from './useUtils'
import type { PaginatedResponse, PaginationParams } from '../types'

interface UsePaginatedQueryOptions<T> {
  queryKey: string | string[]
  queryFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>
  initialParams?: Partial<PaginationParams>
  enabled?: boolean
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  initialParams = {},
  enabled = true,
}: UsePaginatedQueryOptions<T>) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(initialParams.per_page ?? 20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState(initialParams.sort_by ?? '')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialParams.sort_dir ?? 'asc')
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  const debouncedSearch = useDebounce(search, 400)

  const params: PaginationParams = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(sortBy ? { sort_by: sortBy, sort_dir: sortDir } : {}),
    ...filters,
    ...initialParams,
  }

  const key = Array.isArray(queryKey) ? queryKey : [queryKey]

  const query = useQuery({
    queryKey: [...key, params],
    queryFn: () => queryFn(params),
    enabled,
    placeholderData: (prev) => prev,
  })

  const handleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(column)
        setSortDir('asc')
      }
      setPage(1)
    },
    [sortBy]
  )

  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    setPage(1)
  }, [])

  const handleFilter = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  return {
    ...query,
    page,
    perPage,
    search,
    sortBy,
    sortDir,
    filters,
    setPage,
    setPerPage,
    handleSort,
    handleSearch,
    handleFilter,
    total: query.data?.meta?.total ?? 0,
    lastPage: query.data?.meta?.last_page ?? 1,
  }
}
