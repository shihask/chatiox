import { recordAudit } from '../../../_shared/audit.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as templatesRepository from '../../repositories/communication/templates.repository.ts'
import * as channelsRepository from '../../repositories/communication/channels.repository.ts'
import { getProvider } from '../../channels/providerRegistry.ts'
import { mapChannelTemplateRowToDTO, mapTemplateRowToDTO } from '../../mappers/communication/templates.mapper.ts'
import type { CreateTemplateInput } from '../../schemas/communication/templates.schemas.ts'
import type { ChannelTemplateDTO, TemplateDTO } from '../../dtos/communication/templates.dtos.ts'
import type { ChannelType } from '../../../_shared/channelTypes.ts'

const MANAGE_ROLES = ['owner', 'admin', 'manager'] as const
const CONNECTION_MANAGE_ROLES = ['owner', 'admin'] as const

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

/** For the Inbox composer's "Send Template" picker -- every template already synced for a
 * specific connection. Read-only; doesn't call Meta. */
export async function listChannelTemplatesByConnection(
  ctx: WorkspaceRequestContext,
  channelConnectionId: string,
): Promise<ChannelTemplateDTO[]> {
  await channelsRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, channelConnectionId)
  const rows = await templatesRepository.listChannelTemplatesByConnection(ctx.supabase, ctx.workspaceId, channelConnectionId)
  return rows.map(mapChannelTemplateRowToDTO)
}

/** Pulls this connection's templates straight from the provider (Meta Business Manager, for
 * WhatsApp) and upserts them into channel_templates -- auto-matching/creating the parent business
 * `templates` row by name so syncing doesn't force pre-creating one row per Meta template first. */
export async function syncChannelTemplates(
  ctx: WorkspaceRequestContext,
  channelConnectionId: string,
): Promise<ChannelTemplateDTO[]> {
  requireRole(ctx, [...CONNECTION_MANAGE_ROLES])

  const connectionRow = await channelsRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, channelConnectionId)
  const channelType = connectionRow.channel_type as ChannelType
  const provider = getProvider(channelType)
  if (!provider.listApprovedTemplates) {
    throw new BadRequestError(`${channelType} doesn't support syncing templates yet`)
  }

  const resolvedConnection = await channelsRepository.resolveForSending(channelConnectionId)
  if (!resolvedConnection) throw new BadRequestError(`${channelType} isn't connected for this workspace yet`)

  const providerTemplates = await provider.listApprovedTemplates(resolvedConnection)

  const synced: ChannelTemplateDTO[] = []
  for (const providerTemplate of providerTemplates) {
    const templateRow = await templatesRepository.findOrCreateTemplateByName(
      ctx.supabase,
      ctx.workspaceId,
      providerTemplate.name,
      ctx.userId,
    )
    const row = await templatesRepository.upsertChannelTemplate(ctx.supabase, ctx.workspaceId, {
      templateId: templateRow.id,
      channelConnectionId,
      channelType,
      providerTemplateName: providerTemplate.name,
      languageCode: providerTemplate.languageCode,
      category: providerTemplate.category,
      body: providerTemplate.bodyText,
      variables: Array.from({ length: providerTemplate.variableCount }, (_, i) => `${i + 1}`),
      status: providerTemplate.status,
      providerTemplateId: providerTemplate.providerTemplateId,
    })
    synced.push(mapChannelTemplateRowToDTO(row))
  }

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'channel_template.synced',
    targetType: 'channel_connection',
    targetId: channelConnectionId,
    metadata: { count: synced.length },
  })

  return synced
}
