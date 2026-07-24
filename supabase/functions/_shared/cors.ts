function getAllowedOrigins(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function resolveAllowedOrigin(req: Request): string {
  const requestOrigin = req.headers.get('origin') ?? ''
  const allowedOrigins = getAllowedOrigins()
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin
  return allowedOrigins[0] ?? ''
}

function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(req),
    'Access-Control-Allow-Headers':
      'authorization, apikey, content-type, x-client-info, x-workspace-id',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    Vary: 'Origin',
  }
}

export function corsPreflightResponse(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) })
}

/** Wraps a Response with CORS headers -- call this once, right before returning from index.ts. */
export function withCors(req: Request, response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders(req))) {
    headers.set(key, value)
  }
  return new Response(response.body, { status: response.status, headers })
}
