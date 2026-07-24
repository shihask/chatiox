export interface ApiEnvelope<T> {
  data: T
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorPayload {
  error: {
    code?: string
    message: string
    details?: unknown
  }
}
