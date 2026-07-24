import { useState } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export function usePagination(initialPageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(initialPageSize)

  return { page, pageSize, setPage, resetPage: () => { setPage(1); } }
}
