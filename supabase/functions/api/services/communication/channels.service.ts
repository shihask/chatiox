import { recordAudit } from '../../../_shared/audit.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as channelsRepository from '../../repositories/communication/channels.repository.ts'
import * as embeddedSignup from '../../channels/providers/whatsapp/embeddedSignup.ts'
import { mapChannelConnectionRowToDTO } from '../../mappers/communication/channels.mapper.ts'
import type {
  CompleteEmbeddedSignupInput,
  CreateConnectionInput,
  DiscoverEmbeddedSignupAssetsInput,
  UpdateConnectionInput,
} from '../../schemas/communication/channels.schemas.ts'
import type {
  ChannelConnectionDTO,
  EmbeddedSignupDiscoveryDTO,
} from '../../dtos/communication/channels.dtos.ts'

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

/** Step 1 of WhatsApp Embedded Signup: exchanges the popup's authorization code for an access
 * token, stashes it in Vault (no channel_connections row exists yet -- that only happens once the
 * user picks which discovered phone number to connect), and lists every WABA/phone number the
 * token can see. Graph API is the source of truth for this list, not the popup's own payload. */
export async function discoverWhatsAppEmbeddedSignupAssets(
  ctx: WorkspaceRequestContext,
  input: DiscoverEmbeddedSignupAssetsInput,
): Promise<EmbeddedSignupDiscoveryDTO> {
  requireRole(ctx, [...MANAGE_ROLES])

  const { accessToken } = await embeddedSignup.exchangeCodeForAccessToken(input.code)
  const secretId = await channelsRepository.storeSecret(ctx.workspaceId, { accessToken })

  const wabaIds = [...new Set([...(input.wabaIds ?? []), ...(input.wabaId ? [input.wabaId] : [])])]
  const candidates = await embeddedSignup.discoverWhatsAppBusinessAssets(accessToken, {
    wabaIds,
    phoneNumberId: input.phoneNumberId,
  })

  return { secretId, candidates }
}

/** Step 2: re-fetches the SELECTED candidate's details fresh (never trusts the frontend's echoed
 * metadata), subscribes the app to that WABA's webhooks, then reuses the exact same
 * channelsRepository.create() the manual entry flow calls -- Embedded Signup only changes how the
 * secret/metadata get sourced, not the storage shape. */
export async function completeWhatsAppEmbeddedSignup(
  ctx: WorkspaceRequestContext,
  input: CompleteEmbeddedSignupInput,
): Promise<ChannelConnectionDTO> {
  requireRole(ctx, [...MANAGE_ROLES])

  const { accessToken } = (await channelsRepository.getSecretById(input.secretId)) as { accessToken: string }
  const details = await embeddedSignup.getPhoneNumberDetails(input.phoneNumberId, accessToken)
  await embeddedSignup.subscribeWabaToWebhook(input.wabaId, accessToken)

  const row = await channelsRepository.createWithExistingSecret(
    ctx.supabase,
    ctx.workspaceId,
    {
      channelType: 'whatsapp',
      displayName: details.verifiedName || 'WhatsApp',
      externalAccountId: input.phoneNumberId,
      metadata: {
        wabaId: input.wabaId,
        displayPhoneNumber: details.displayPhoneNumber,
        verifiedName: details.verifiedName,
        qualityRating: details.qualityRating,
        messagingLimitTier: details.messagingLimitTier,
        connectionMethod: 'embedded_signup',
      },
      secretId: input.secretId,
    },
    ctx.userId,
  )

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'channel_connection.created',
    targetType: 'channel_connection',
    targetId: row.id,
    metadata: { channelType: row.channel_type, displayName: row.display_name, connectionMethod: 'embedded_signup' },
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
