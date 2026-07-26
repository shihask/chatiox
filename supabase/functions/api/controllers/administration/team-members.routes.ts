import * as teamMembersController from './team-members.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/invites/:token' }),
    tier: 'public',
    handler: teamMembersController.previewInvite,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/team-members' }),
    tier: 'workspace',
    handler: teamMembersController.listMembers,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/team-members/:userId' }),
    tier: 'workspace',
    handler: teamMembersController.updateMemberRole,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/team-members/:userId' }),
    tier: 'workspace',
    handler: teamMembersController.removeMember,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/team-invites' }),
    tier: 'workspace',
    handler: teamMembersController.listInvites,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/team-invites' }),
    tier: 'workspace',
    handler: teamMembersController.createInvite,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/team-invites/:id' }),
    tier: 'workspace',
    handler: teamMembersController.revokeInvite,
  },
]
