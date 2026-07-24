import { authenticate } from './authMiddleware.ts'
import { errorToResponse } from '../errors.ts'
import type { AuthenticatedHandler, Handler } from './requestContext.ts'

/** JWT-verified, no workspace required -- used by GET /auth/me and POST /auth/logout. */
export function withAuthenticatedHttp(handler: AuthenticatedHandler): Handler {
  return async (req, args) => {
    try {
      const ctx = await authenticate(req)
      return await handler(req, { ...args, ctx })
    } catch (err) {
      return errorToResponse(err)
    }
  }
}
