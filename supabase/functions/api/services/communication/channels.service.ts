import { recordAudit } from '../../../_shared/audit.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as channelsRepository from '../../repositories/communication/channels.repository.ts'
import { mapChannelConnectionRowToDTO } from '../../mappers/communication/channels.mapper.ts'
import type { CreateConnectionInput, UpdateConnectionInput } from '../../schemas/communication/channels.schemas.ts'
import type { ChannelConnectionDTO } from '../../dtos/communication/channels.dtos.ts'

const MANAGE_ROLES = ['owner', 'admin'] as const

export async function listConnections(ctx: WorkspaceRequestContext): Promise<ChannelConnectionDTO[]> {
  requireRole(ctx, [...MANAGE_ROLES])
  const rows = await channelsRepository.list(ctx.supabase, ctx.workspaceId)
  return rows.map(mapChannelConnectionRowToDTO)
}

export async function createConnection(
  ctx: WorkspaceRequestContext,
  input: CreateConnectionInput,
): Promise<ChannelConnectionDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await channelsRepository.create(ctx.supabase, ctx.workspaceId, input, ctx.userId)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'channel_connection.created',
    targetType: 'channel_connection',
    targetId: row.id,
    metadata: { channelType: row.channel_type, displayName: row.display_name },
  })

  return mapChannelConnectionRowToDTO(row)
}

export async function updateConnection(
  ctx: WorkspaceRequestContext,
  id: string,
  input: UpdateConnectionInput,
): Promise<ChannelConnectionDTO> {
  requireRole(ctx, [...MANAGE_ROLES])
  const row = await channelsRepository.update(ctx.supabase, ctx.workspaceId, id, input)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'channel_connection.updated',
    targetType: 'channel_connection',
    targetId: id,
    metadata: { changedFields: Object.keys(input) },
  })

  return mapChannelConnectionRowToDTO(row)
}

export async function deleteConnection(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  requireRole(ctx, [...MANAGE_ROLES])
  await channelsRepository.remove(ctx.supabase, ctx.workspaceId, id)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'channel_connection.deleted',
    targetType: 'channel_connection',
    targetId: id,
  })
}
