import { recordAudit } from '../../../_shared/audit.ts'
import { emit } from '../../../_shared/events.ts'
import { createServiceRoleClient } from '../../../_shared/supabaseClient.ts'
import { ForbiddenError, NotFoundError } from '../../../_shared/errors.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as teamMembersRepository from '../../repositories/administration/team-members.repository.ts'
import { mapInviteRowToDTO, mapMemberRowToDTO } from '../../mappers/administration/team-members.mapper.ts'
import type { CreateInviteInput, UpdateMemberRoleInput } from '../../schemas/administration/team-members.schemas.ts'
import type { InvitePreviewDTO, TeamInviteDTO, TeamMemberDTO } from '../../dtos/administration/team-members.dtos.ts'

function requireRole(ctx: WorkspaceRequestContext, roles: Array<'owner' | 'admin'>): void {
  if (!roles.includes(ctx.workspaceRole as 'owner' | 'admin')) {
    throw new ForbiddenError('You do not have permission to manage team members')
  }
}

/** Any workspace member can see who else is on the team -- only the mutations below (role changes,
 * removals, invites) are restricted to owner/admin. */
export async function listMembers(ctx: WorkspaceRequestContext): Promise<TeamMemberDTO[]> {
  const rows = await teamMembersRepository.listMembers(ctx.supabase, ctx.workspaceId)
  return rows.map(mapMemberRowToDTO)
}

export async function updateMemberRole(
  ctx: WorkspaceRequestContext,
  targetUserId: string,
  input: UpdateMemberRoleInput,
): Promise<void> {
  requireRole(ctx, ['owner', 'admin'])
  await teamMembersRepository.updateMemberRole(ctx.supabase, ctx.workspaceId, targetUserId, input.role)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'team.member.role_changed',
    targetType: 'tenant_membership',
    targetId: targetUserId,
    metadata: { newRole: input.role },
  })
}

export async function removeMember(ctx: WorkspaceRequestContext, targetUserId: string): Promise<void> {
  requireRole(ctx, ['owner', 'admin'])
  await teamMembersRepository.removeMember(ctx.supabase, ctx.workspaceId, targetUserId)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'team.member.removed',
    targetType: 'tenant_membership',
    targetId: targetUserId,
  })
}

export async function listInvites(ctx: WorkspaceRequestContext): Promise<TeamInviteDTO[]> {
  requireRole(ctx, ['owner', 'admin'])
  const rows = await teamMembersRepository.listInvites(ctx.supabase, ctx.workspaceId)
  return rows.map(mapInviteRowToDTO)
}

export async function createInvite(ctx: WorkspaceRequestContext, input: CreateInviteInput): Promise<TeamInviteDTO> {
  requireRole(ctx, ['owner', 'admin'])
  const row = await teamMembersRepository.createInvite(ctx.supabase, ctx.workspaceId, input, ctx.userId)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'team.invite.created',
    targetType: 'tenant_invite',
    targetId: row.id,
    metadata: { email: row.email, role: row.role },
  })
  emit({
    type: 'TeamMemberInvited',
    workspaceId: ctx.workspaceId,
    inviteId: row.id,
    email: row.email,
    actorUserId: ctx.userId,
    occurredAt: new Date().toISOString(),
  })

  return mapInviteRowToDTO(row)
}

/** Public (unauthenticated) preview so the signup page can show "You're joining <workspace>" before
 * the invitee has an account -- see auth.service.ts's signup() for the acceptance side. */
export async function previewInvite(token: string): Promise<InvitePreviewDTO> {
  const serviceRoleClient = createServiceRoleClient()
  const invite = await teamMembersRepository.findPendingInviteByToken(serviceRoleClient, token)
  if (!invite) throw new NotFoundError('This invite link is invalid or has expired')
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new NotFoundError('This invite link has expired')
  }
  return { workspaceName: invite.tenants?.name ?? '', email: invite.email, role: invite.role }
}

export async function revokeInvite(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  requireRole(ctx, ['owner', 'admin'])
  await teamMembersRepository.revokeInvite(ctx.supabase, ctx.workspaceId, id)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'team.invite.revoked',
    targetType: 'tenant_invite',
    targetId: id,
  })
}
