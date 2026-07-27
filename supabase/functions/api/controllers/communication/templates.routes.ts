import * as templatesController from './templates.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/templates' }),
    tier: 'workspace',
    handler: templatesController.list,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/templates' }),
    tier: 'workspace',
    handler: templatesController.create,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/templates/:id' }),
    tier: 'workspace',
    handler: templatesController.remove,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/templates/:id/channel-templates' }),
    tier: 'workspace',
    handler: templatesController.listChannelTemplates,
  },
]
