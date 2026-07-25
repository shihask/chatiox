import * as notesController from './notes.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/contacts/:id/notes' }),
    tier: 'workspace',
    handler: notesController.list,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/contacts/:id/notes' }),
    tier: 'workspace',
    handler: notesController.create,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/notes/:id' }),
    tier: 'workspace',
    handler: notesController.remove,
  },
]
