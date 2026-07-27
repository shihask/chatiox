import * as channelsController from './channels.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/channel-connections' }),
    tier: 'workspace',
    handler: channelsController.list,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/channel-connections' }),
    tier: 'workspace',
    handler: channelsController.create,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/channel-connections/:id' }),
    tier: 'workspace',
    handler: channelsController.update,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/channel-connections/:id' }),
    tier: 'workspace',
    handler: channelsController.remove,
  },
]
