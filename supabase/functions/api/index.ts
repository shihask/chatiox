// Deno.serve entrypoint -- pure transport dispatch, no business logic. This is the ONLY deployed
// function for the entire backend (`supabase functions deploy api`), forever -- see docs/architecture.md §1.
import { corsPreflightResponse, withCors } from '../_shared/cors.ts'
import { notFoundResponse } from '../_shared/response.ts'
import { withPublicHttp } from '../_shared/http/withPublicHttp.ts'
import { withAuthenticatedHttp } from '../_shared/http/withAuthenticatedHttp.ts'
import { withWorkspaceHttp } from '../_shared/http/withWorkspaceHttp.ts'
import { routes } from './router.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse(req)

  // Supabase's gateway strips "/functions/v1" but keeps the function name ("api") in the path
  // the function actually receives -- req.url here is e.g. /api/auth/signup, not /auth/signup.
  // Strip that fixed prefix so routes.ts patterns can stay bare paths like /auth/signup.
  const url = new URL(req.url)
  const pathname = url.pathname.replace(/^\/api/, '') || '/'

  for (const route of routes) {
    if (route.method !== req.method) continue
    const match = route.pattern.exec({ pathname })
    if (!match) continue

    const args = { params: match.pathname.groups }
    let response: Response
    switch (route.tier) {
      case 'public':
        response = await withPublicHttp(route.handler)(req, args)
        break
      case 'authenticated':
        response = await withAuthenticatedHttp(route.handler)(req, args)
        break
      case 'workspace':
        response = await withWorkspaceHttp(route.handler)(req, args)
        break
    }
    return withCors(req, response)
  }

  return withCors(req, notFoundResponse())
})
