import { recordAudit } from '../../../_shared/audit.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as workspaceRepository from '../../repositories/administration/workspace.repository.ts'
import { mapLeadSourceRowToDTO, mapLeadStatusRowToDTO } from '../../mappers/crm/contacts.mapper.ts'
import type {
  CreateLeadSourceInput,
  CreateLeadStatusInput,
  UpdateLeadSourceInput,
  UpdateLeadStatusInput,
  UpdateWorkspaceInput,
} from '../../schemas/administration/workspace.schemas.ts'
import type { LeadSourceDTO, LeadStatusDTO } from '../../dtos/crm/contacts.dtos.ts'
import type { WorkspaceProfileDTO } from '../../dtos/administration/workspace.dtos.ts'

const MANAGE_ROLES = ['owner', 'admin'] as const

export async function updateWorkspace(
  ctx: WorkspaceRequestContext,
  input: UpdateWorkspaceInput,
): Promise<WorkspaceProfileDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await workspaceRepository.updateWorkspace(ctx.supabase, ctx.workspaceId, input.name)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'workspace.updated',
    targetType: 'workspace',
    targetId: ctx.workspaceId,
    metadata: { name: input.name },
  })

  return { id: row.id, name: row.name, slug: row.slug }
}

export async function createLeadStatus(
  ctx: WorkspaceRequestContext,
  input: CreateLeadStatusInput,
): Promise<LeadStatusDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await workspaceRepository.createLeadStatus(ctx.supabase, ctx.workspaceId, input)
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'lead_status.created',
    targetType: 'lead_status',
    targetId: row.id,
    metadata: { name: row.name },
  })
  return mapLeadStatusRowToDTO(row)
}

export async function updateLeadStatus(
  ctx: WorkspaceRequestContext,
  id: string,
  input: UpdateLeadStatusInput,
): Promise<LeadStatusDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await workspaceRepository.updateLeadStatus(ctx.supabase, ctx.workspaceId, id, input)
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'lead_status.updated',
    targetType: 'lead_status',
    targetId: id,
    metadata: { changedFields: Object.keys(input) },
  })
  return mapLeadStatusRowToDTO(row)
}

export async function deleteLeadStatus(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  requireRole(ctx, [...MANAGE_ROLES])
  await workspaceRepository.deleteLeadStatus(ctx.supabase, ctx.workspaceId, id)
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'lead_status.deleted',
    targetType: 'lead_status',
    targetId: id,
  })
}

export async function createLeadSource(
  ctx: WorkspaceRequestContext,
  input: CreateLeadSourceInput,
): Promise<LeadSourceDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await workspaceRepository.createLeadSource(ctx.supabase, ctx.workspaceId, input)
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'lead_source.created',
    targetType: 'lead_source',
    targetId: row.id,
    metadata: { name: row.name },
  })
  return mapLeadSourceRowToDTO(row)
}

export async function updateLeadSource(
  ctx: WorkspaceRequestContext,
  id: string,
  input: UpdateLeadSourceInput,
): Promise<LeadSourceDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await workspaceRepository.updateLeadSource(ctx.supabase, ctx.workspaceId, id, input)
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'lead_source.updated',
    targetType: 'lead_source',
    targetId: id,
    metadata: { changedFields: Object.keys(input) },
  })
  return mapLeadSourceRowToDTO(row)
}

export async function deleteLeadSource(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  requireRole(ctx, [...MANAGE_ROLES])
  await workspaceRepository.deleteLeadSource(ctx.supabase, ctx.workspaceId, id)
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'lead_source.deleted',
    targetType: 'lead_source',
    targetId: id,
  })
}
