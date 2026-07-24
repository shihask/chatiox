import { createAnonClient } from '../supabaseClient.ts'
import { UnauthorizedError } from '../errors.ts'
import type { AuthenticatedRequestContext } from './requestContext.ts'

export function extractBearerToken(req: Request): string {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing bearer token')
  return header.slice('Bearer '.length)
}

export async function authenticate(req: Request): Promise<AuthenticatedRequestContext> {
  const token = extractBearerToken(req)

  const supabase = createAnonClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new UnauthorizedError('Invalid or expired token')

  return { userId: data.user.id, email: data.user.email ?? '' }
}
