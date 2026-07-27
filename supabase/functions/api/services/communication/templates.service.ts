import { recordAudit } from '../../../_shared/audit.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as templatesRepository from '../../repositories/communication/templates.repository.ts'
import { mapChannelTemplateRowToDTO, mapTemplateRowToDTO } from '../../mappers/communication/templates.mapper.ts'
import type { CreateTemplateInput } from '../../schemas/communication/templates.schemas.ts'
import type { ChannelTemplateDTO, TemplateDTO } from '../../dtos/communication/templates.dtos.ts'

const MANAGE_ROLES = ['owner', 'admin', 'manager'] as const

export async function listTemplates(ctx: WorkspaceRequestContext): Promise<TemplateDTO[]> {
  const rows = await templatesRepository.list(ctx.supabase, ctx.workspaceId)
  return rows.map(mapTemplateRowToDTO)
}

export async function createTemplate(ctx: WorkspaceRequestContext, input: CreateTemplateInput): Promise<TemplateDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await templatesRepository.create(ctx.supabase, ctx.workspaceId, input, ctx.userId)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'template.created',
    targetType: 'template',
    targetId: row.id,
    metadata: { name: row.name },
  })

  return mapTemplateRowToDTO(row)
}

export async function deleteTemplate(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  requireRole(ctx, [...MANAGE_ROLES])
  await templatesRepository.remove(ctx.supabase, ctx.workspaceId, id)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'template.deleted',
    targetType: 'template',
    targetId: id,
  })
}

export async function listChannelTemplates(
  ctx: WorkspaceRequestContext,
  templateId: string,
): Promise<ChannelTemplateDTO[]> {
  await templatesRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, templateId)
  const rows = await templatesRepository.listChannelTemplates(ctx.supabase, ctx.workspaceId, templateId)
  return rows.map(mapChannelTemplateRowToDTO)
}
