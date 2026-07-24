import { parseBody } from '../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk } from '../../_shared/response.ts'
import { extractBearerToken } from '../../_shared/http/authMiddleware.ts'
import type { AuthenticatedHandler, PublicHandler } from '../../_shared/http/requestContext.ts'
import * as authService from '../services/auth.service.ts'
import { loginSchema, refreshSchema, signupSchema } from '../schemas/auth.schemas.ts'

export const signup: PublicHandler = async (req) => {
  const input = await parseBody(signupSchema, req)
  const session = await authService.signup(input)
  return jsonCreated(session)
}

export const login: PublicHandler = async (req) => {
  const input = await parseBody(loginSchema, req)
  const session = await authService.login(input)
  return jsonOk(session)
}

export const refresh: PublicHandler = async (req) => {
  const input = await parseBody(refreshSchema, req)
  const session = await authService.refresh(input)
  return jsonOk(session)
}

export const me: AuthenticatedHandler = async (req, { ctx }) => {
  const accessToken = extractBearerToken(req)
  const result = await authService.me(ctx.userId, ctx.email, accessToken)
  return jsonOk(result)
}

export const logout: AuthenticatedHandler = async (req) => {
  const accessToken = extractBearerToken(req)
  await authService.logout(accessToken)
  return jsonNoContent()
}
