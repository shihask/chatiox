import * as authController from './auth.controller.ts'
import type { RouteDefinition } from '../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/auth/signup' }),
    tier: 'public',
    handler: authController.signup,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/auth/login' }),
    tier: 'public',
    handler: authController.login,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/auth/refresh' }),
    tier: 'public',
    handler: authController.refresh,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/auth/me' }),
    tier: 'authenticated',
    handler: authController.me,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/auth/logout' }),
    tier: 'authenticated',
    handler: authController.logout,
  },
]
