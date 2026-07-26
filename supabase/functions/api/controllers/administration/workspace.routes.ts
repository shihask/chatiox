import * as workspaceController from './workspace.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/workspace' }),
    tier: 'workspace',
    handler: workspaceController.updateWorkspace,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/lead-statuses' }),
    tier: 'workspace',
    handler: workspaceController.createLeadStatus,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/lead-statuses/:id' }),
    tier: 'workspace',
    handler: workspaceController.updateLeadStatus,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/lead-statuses/:id' }),
    tier: 'workspace',
    handler: workspaceController.deleteLeadStatus,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/lead-sources' }),
    tier: 'workspace',
    handler: workspaceController.createLeadSource,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/lead-sources/:id' }),
    tier: 'workspace',
    handler: workspaceController.updateLeadSource,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/lead-sources/:id' }),
    tier: 'workspace',
    handler: workspaceController.deleteLeadSource,
  },
]
