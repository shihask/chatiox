import * as tasksController from './tasks.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/contacts/:id/tasks' }),
    tier: 'workspace',
    handler: tasksController.listByContact,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/contacts/:id/tasks' }),
    tier: 'workspace',
    handler: tasksController.createForContact,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/tasks' }),
    tier: 'workspace',
    handler: tasksController.list,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/tasks/:id' }),
    tier: 'workspace',
    handler: tasksController.update,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/tasks/:id' }),
    tier: 'workspace',
    handler: tasksController.remove,
  },
]
