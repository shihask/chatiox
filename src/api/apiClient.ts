import { config } from '@/lib/config'
import { tokenStorage } from '@/lib/tokenStorage'
import type { ApiErrorPayload, PaginatedResponse } from '@/types/dto/envelope'

// The deployed edge function is named "api"; its entrypoint strips only the "/api" segment
// and its routes are bare paths (e.g. /auth/signup), so this must match exactly -- no /v1.
const API_PREFIX = '/api'

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** Skips JSON.stringify + the Content-Type header -- the browser sets its own multipart
   * boundary for a FormData body, which a fixed `application/json` header would break. */
  isFormData?: boolean
  /** internal: prevents infinite refresh loops */
  _isRetry?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${config.apiUrl}${API_PREFIX}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload['error'] | null> {
  try {
    const payload = (await response.clone().json()) as Partial<ApiErrorPayload>
    return payload.error ?? null
  } catch {
    return null
  }
}

/** Raw refresh call -- deliberately bypasses request() to avoid a circular retry loop. */
async function refreshSession(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return false

  const response = await fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) return false

  const payload = (await response.json()) as {
    data: { accessToken: string; refreshToken: string }
  }
  tokenStorage.setSession(payload.data)
  return true
}

/** Returns the full envelope ({data} or {data, meta}) -- request()/requestPaginated() unwrap it. */
async function requestRaw<TEnvelope>(
  path: string,
  options: RequestOptions = {},
): Promise<TEnvelope | undefined> {
  const { method = 'GET', body, query, isFormData, _isRetry } = options

  const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  const workspaceId = tokenStorage.getCurrentWorkspaceId()
  if (workspaceId) headers['X-Workspace-Id'] = workspaceId

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !_isRetry && path !== '/auth/refresh') {
    const refreshed = await refreshSession()
    if (refreshed) return requestRaw<TEnvelope>(path, { ...options, _isRetry: true })
    tokenStorage.clear()
  }

  if (!response.ok) {
    const error = await parseErrorPayload(response)
    throw new ApiError(
      response.status,
      error?.message ?? response.statusText,
      error?.code,
      error?.details,
    )
  }

  if (response.status === 204) return undefined

  return (await response.json()) as TEnvelope
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await requestRaw<{ data: T }>(path, options)
  return payload ? payload.data : (undefined as T)
}

async function requestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<PaginatedResponse<T>> {
  const payload = await requestRaw<PaginatedResponse<T>>(path, options)
  if (!payload) throw new ApiError(500, 'Expected a paginated response but received no content')
  return payload
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { query }),
  getPaginated: <T>(path: string, query?: RequestOptions['query']) =>
    requestPaginated<T>(path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body, isFormData: true }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
