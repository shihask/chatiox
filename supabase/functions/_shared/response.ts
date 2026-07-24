function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function jsonOk<T>(data: T): Response {
  return jsonResponse({ data }, 200)
}

export function jsonCreated<T>(data: T): Response {
  return jsonResponse({ data }, 201)
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function jsonPaginated<T>(items: T[], meta: PaginationMeta): Response {
  return jsonResponse({ data: items, meta }, 200)
}

export function jsonNoContent(): Response {
  return new Response(null, { status: 204 })
}

export function notFoundResponse(): Response {
  return jsonResponse({ error: { code: 'not_found', message: 'Not found' } }, 404)
}
