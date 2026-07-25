import * as analyticsController from './analytics.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/analytics/leads-by-source' }),
    tier: 'workspace',
    handler: analyticsController.leadsBySource,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/analytics/lead-status-distribution' }),
    tier: 'workspace',
    handler: analyticsController.leadStatusDistribution,
  },
]
