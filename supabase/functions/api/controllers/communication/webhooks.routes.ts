import * as webhooksController from './webhooks.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/webhooks/:channelType' }),
    tier: 'webhook',
    handler: webhooksController.handleWebhook,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/webhooks/:channelType' }),
    tier: 'webhook',
    handler: webhooksController.handleWebhook,
  },
]
