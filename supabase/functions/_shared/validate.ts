import type { ZodType } from 'npm:zod@4'
import { BadRequestError } from './errors.ts'

export async function parseBody<T>(schema: ZodType<T>, req: Request): Promise<T> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    throw new BadRequestError('Request body must be valid JSON')
  }

  const result = schema.safeParse(json)
  if (!result.success) throw new BadRequestError('Validation failed', result.error.issues)
  return result.data
}

export function parseQuery<T>(schema: ZodType<T>, url: URL): T {
  const raw = Object.fromEntries(url.searchParams.entries())
  const result = schema.safeParse(raw)
  if (!result.success) throw new BadRequestError('Invalid query parameters', result.error.issues)
  return result.data
}
