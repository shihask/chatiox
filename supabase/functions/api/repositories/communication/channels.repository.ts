import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { createServiceRoleClient } from '../../../_shared/supabaseClient.ts'
import { ConflictError, InternalError, NotFoundError, mapPostgrestError } from '../../../_shared/errors.ts'
import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { CreateConnectionInput, UpdateConnectionInput } from '../../schemas/communication/channels.schemas.ts'
import type { ResolvedChannelConnection } from '../../channels/channel.types.ts'

export interface ChannelConnectionRow {
  id: string
  tenant_id: string
  channel_type: string
  display_name: string
  external_account_id: string | null
  metadata: Record<string, unknown>
  secret_id: string | null
  status: string
  last_error: string | null
  connected_by: string | null
  created_at: string
  updated_at: string
}

const CONNECTION_SELECT =
  'id, tenant_id, channel_type, display_name, external_account_id, metadata, secret_id, status, last_error, connected_by, created_at, updated_at'

export async function list(supabase: SupabaseClient, workspaceId: string): Promise<ChannelConnectionRow[]> {
  const { data, error } = await supabase
    .from('channel_connections')
    .select(CONNECTION_SELECT)
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: true })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as unknown as ChannelConnectionRow[]
}

/** Used only when starting a brand-new, business-initiated conversation (no existing conversation
 * to resolve a connection from yet). Deliberately returns every match rather than `.maybeSingle()`
 * -- the caller must decide what to do with more than one connected connection of this channel
 * type, rather than crashing on an ambiguous result (see sendMessage's connection-resolution
 * comment for the bug this pattern avoids repeating). */
export async function listConnectedForChannelType(
  supabase: SupabaseClient,
  workspaceId: string,
  channelType: ChannelType,
): Promise<ChannelConnectionRow[]> {
  const { data, error } = await supabase
    .from('channel_connections')
    .select(CONNECTION_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('channel_type', channelType)
    .eq('status', 'connected')
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as unknown as ChannelConnectionRow[]
}

export async function getByIdOrThrow(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
): Promise<ChannelConnectionRow> {
  const { data, error } = await supabase
    .from('channel_connections')
    .select(CONNECTION_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  if (!data) throw new NotFoundError('Channel connection not found')
  return data as unknown as ChannelConnectionRow
}

async function storeSecret(workspaceId: string, secret: Record<string, unknown>): Promise<string> {
  const serviceRoleClient = createServiceRoleClient()
  const { data, error } = await serviceRoleClient.rpc('channel_connection_set_secret', {
    p_secret_value: JSON.stringify(secret),
    p_name: `channel-connection-${workspaceId}-${crypto.randomUUID()}`,
    p_description: `Chatiox channel connection secret for tenant ${workspaceId}`,
  })
  if (error) throw new InternalError(error.message)
  return data as string
}

export async function create(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateConnectionInput,
  connectedBy: string,
): Promise<ChannelConnectionRow> {
  const secretId = await storeSecret(workspaceId, input.secret)

  const { data, error } = await supabase
    .from('channel_connections')
    .insert({
      tenant_id: workspaceId,
      channel_type: input.channelType,
      display_name: input.displayName,
      external_account_id: input.externalAccountId ?? null,
      metadata: input.metadata ?? {},
      secret_id: secretId,
      status: 'connected',
      connected_by: connectedBy,
    })
    .select(CONNECTION_SELECT)
    .single()
  if (error) {
    if (error.code === '23505' && error.message.includes('uq_channel_connections_type_external_account')) {
      throw new ConflictError(`This ${input.channelType} account is already connected to another workspace`)
    }
    throw mapPostgrestError(error)
  }
  return data as unknown as ChannelConnectionRow
}

export async function update(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  input: UpdateConnectionInput,
): Promise<ChannelConnectionRow> {
  const existing = await getByIdOrThrow(supabase, workspaceId, id)

  const updates: Record<string, unknown> = {}
  if (input.displayName !== undefined) updates.display_name = input.displayName
  if (input.externalAccountId !== undefined) updates.external_account_id = input.externalAccountId
  if (input.metadata !== undefined) updates.metadata = input.metadata
  if (input.status !== undefined) updates.status = input.status

  if (input.secret !== undefined) {
    if (existing.secret_id) {
      const serviceRoleClient = createServiceRoleClient()
      const { error } = await serviceRoleClient.rpc('channel_connection_update_secret', {
        p_secret_id: existing.secret_id,
        p_new_value: JSON.stringify(input.secret),
      })
      if (error) throw new InternalError(error.message)
    } else {
      updates.secret_id = await storeSecret(workspaceId, input.secret)
    }
  }

  const { data, error } = await supabase
    .from('channel_connections')
    .update(updates)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .select(CONNECTION_SELECT)
    .single()
  if (error) {
    if (error.code === '23505' && error.message.includes('uq_channel_connections_type_external_account')) {
      throw new ConflictError(`This ${existing.channel_type} account is already connected to another workspace`)
    }
    throw mapPostgrestError(error)
  }
  return data as unknown as ChannelConnectionRow
}

export async function remove(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('channel_connections').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}

/** The ONLY place a decrypted secret ever materializes in application code -- service-role only,
 * called from inboxService.sendMessage right before invoking a provider, never exposed via any DTO. */
export async function resolveForSending(connectionId: string): Promise<ResolvedChannelConnection | null> {
  const serviceRoleClient = createServiceRoleClient()
  const { data, error } = await serviceRoleClient
    .from('channel_connections')
    .select('id, tenant_id, channel_type, external_account_id, metadata, secret_id')
    .eq('id', connectionId)
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  if (!data) return null

  let secret: Record<string, unknown> = {}
  if (data.secret_id) {
    const { data: secretValue, error: secretError } = await serviceRoleClient.rpc('channel_connection_get_secret', {
      p_secret_id: data.secret_id as string,
    })
    if (secretError) throw new InternalError(secretError.message)
    secret = secretValue ? (JSON.parse(secretValue as string) as Record<string, unknown>) : {}
  }

  return {
    id: data.id as string,
    tenantId: data.tenant_id as string,
    channelType: data.channel_type as ChannelType,
    externalAccountId: data.external_account_id as string | null,
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    secret,
  }
}

/** Resolves which workspace's connection an inbound webhook belongs to, keyed by the provider's own
 * account identifier (e.g. WhatsApp phone_number_id). Service-role -- runs before any tenant/auth
 * context exists (see communication/webhooks.controller.ts). */
export async function findByExternalAccountId(
  channelType: ChannelType,
  externalAccountId: string,
): Promise<{ id: string; tenantId: string; channelType: ChannelType; status: string } | null> {
  const serviceRoleClient = createServiceRoleClient()
  const { data, error } = await serviceRoleClient
    .from('channel_connections')
    .select('id, tenant_id, channel_type, status')
    .eq('channel_type', channelType)
    .eq('external_account_id', externalAccountId)
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  if (!data) return null
  return {
    id: data.id as string,
    tenantId: data.tenant_id as string,
    channelType: data.channel_type as ChannelType,
    status: data.status as string,
  }
}

