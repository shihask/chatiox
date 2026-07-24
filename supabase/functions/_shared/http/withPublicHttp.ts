import { errorToResponse } from '../errors.ts'
import type { Handler, PublicHandler } from './requestContext.ts'

/** No auth, no workspace -- just CORS/error handling. Used by signup/login/refresh. */
export function withPublicHttp(handler: PublicHandler): Handler {
  return async (req, args) => {
    try {
      return await handler(req, args)
    } catch (err) {
      return errorToResponse(err)
    }
  }
}
