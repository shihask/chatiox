import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { ConflictError, mapPostgrestError, NotFoundError } from '../../../_shared/errors.ts'
import type { ListParams, Page } from '../../../_shared/repository.ts'
import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { UpdateConversationInput } from '../../schemas/communication/inbox.schemas.ts'

export interface ConversationRow {
  id: string
  tenant_id: string
  channel_identity_id: string
  contact_id: string | null
  channel_connection_id: string
  channel_type: string
  provider_thread_id: string | null
  status: string
  tags: string[]
  assigned_to_user_id: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  created_at: string
  updated_at: string
  channel_identities?: { value: string } | null
  contacts?: { id: string; first_name: string; last_name: string | null } | null
}

export interface MessageAttachmentRow {
  id: string
  message_id: string
  content_type: string
  storage_path: string
  file_name: string | null
  file_size_bytes: number | null
}

export interface MessageRow {
  id: string
  tenant_id: string
  conversation_id: string
  channel_connection_id: string
  direction: string
  message_type: string
  body: string | null
  channel_template_id: string | null
  provider_message_id: string | null
  status: string
  error_code: string | null
  error_message: string | null
  sent_by_user_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  occurred_at: string
  message_attachments?: MessageAttachmentRow[]
}

export interface ChannelIdentityRow {
  id: string
  tenant_id: string
  channel_type: string
  value: string
  contact_id: string | null
  first_seen_at: string
  last_seen_at: string
  created_at: string
}

export interface ConversationNoteRow {
  id: string
  tenant_id: string
  conversation_id: string
  body: string
  created_by: string | null
  created_at: string
}

const CONVERSATION_SELECT = '*, channel_identities(value), contacts(id, first_name, last_name)'
const MESSAGE_SELECT = '*, message_attachments(*)'

interface ListConversationsParams extends ListParams {
  status?: string
  assignedToUserId?: string
  channelType?: ChannelType
  unassigned?: boolean
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function list(
  supabase: SupabaseClient,
  workspaceId: string,
  params: ListConversationsParams,
): Promise<Page<ConversationRow>> {
  let query = supabase.from('conversations').select(CONVERSATION_SELECT, { count: 'exact' }).eq('tenant_id', workspaceId)

  if (params.status) query = query.eq('status', params.status)
  if (params.assignedToUserId) query = query.eq('assigned_to_user_id', params.assignedToUserId)
  if (params.channelType) query = query.eq('channel_type', params.channelType)
  if (params.unassigned) query = query.is('contact_id', null)

  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1
  query = query.order('last_message_at', { ascending: false, nullsFirst: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw mapPostgrestError(error)

  return {
    items: (data ?? []) as unknown as ConversationRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function getByIdOrThrow(supabase: SupabaseClient, workspaceId: string, id: string): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  if (!data) throw new NotFoundError('Conversation not found')
  return data as unknown as ConversationRow
}

export async function updateConversation(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  input: UpdateConversationInput,
): Promise<ConversationRow> {
  const updates: Record<string, unknown> = {}
  if (input.status !== undefined) updates.status = input.status
  if (input.assignedToUserId !== undefined) updates.assigned_to_user_id = input.assignedToUserId
  if (input.tags !== undefined) updates.tags = input.tags

  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .select(CONVERSATION_SELECT)
    .single()
  if (error) throw mapPostgrestError(error)
  return data as unknown as ConversationRow
}

async function ensureContactChannelExists(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string,
  channelType: string,
  value: string,
): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from('contact_channels')
    .select('id')
    .eq('tenant_id', workspaceId)
    .eq('channel_type', channelType)
    .eq('value', value)
    .is('deleted_at', null)
    .maybeSingle()
  if (findError) throw mapPostgrestError(findError)
  if (existing) return // already exists (for this or another contact) -- don't fight over it

  const { error } = await supabase
    .from('contact_channels')
    .insert({ tenant_id: workspaceId, contact_id: contactId, channel_type: channelType, value, is_primary: false })
  if (error) throw mapPostgrestError(error)
}

/** Links an existing Contact to a conversation: sets channel_identities.contact_id + the
 * denormalized conversations.contact_id, and ensures a matching contact_channels row exists so
 * Contacts search/forms immediately see this identity too. */
export async function linkContact(
  supabase: SupabaseClient,
  workspaceId: string,
  conversationId: string,
  contactId: string,
): Promise<ConversationRow> {
  const conversation = await getByIdOrThrow(supabase, workspaceId, conversationId)
  const identityValue = conversation.channel_identities?.value
  if (!identityValue) throw new NotFoundError('Conversation identity not found')

  const { error: identityError } = await supabase
    .from('channel_identities')
    .update({ contact_id: contactId })
    .eq('tenant_id', workspaceId)
    .eq('id', conversation.channel_identity_id)
  if (identityError) throw mapPostgrestError(identityError)

  await ensureContactChannelExists(supabase, workspaceId, contactId, conversation.channel_type, identityValue)

  const { data, error } = await supabase
    .from('conversations')
    .update({ contact_id: contactId })
    .eq('tenant_id', workspaceId)
    .eq('id', conversationId)
    .select(CONVERSATION_SELECT)
    .single()
  if (error) throw mapPostgrestError(error)
  return data as unknown as ConversationRow
}

export async function insertConversationEvent(
  supabase: SupabaseClient,
  workspaceId: string,
  conversationId: string,
  eventType: string,
  actorUserId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase
    .from('conversation_events')
    .insert({ tenant_id: workspaceId, conversation_id: conversationId, event_type: eventType, actor_user_id: actorUserId, metadata })
  if (error) throw mapPostgrestError(error)
}

export async function listConversationEvents(
  supabase: SupabaseClient,
  workspaceId: string,
  conversationId: string,
): Promise<Array<{ id: string; conversation_id: string; event_type: string; actor_user_id: string | null; metadata: Record<string, unknown>; created_at: string }>> {
  const { data, error } = await supabase
    .from('conversation_events')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
  if (error) throw mapPostgrestError(error)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Conversation notes
// ---------------------------------------------------------------------------

export async function listConversationNotes(
  supabase: SupabaseClient,
  workspaceId: string,
  conversationId: string,
): Promise<ConversationNoteRow[]> {
  const { data, error } = await supabase
    .from('conversation_notes')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as ConversationNoteRow[]
}

export async function createConversationNote(
  supabase: SupabaseClient,
  workspaceId: string,
  conversationId: string,
  body: string,
  createdBy: string,
): Promise<ConversationNoteRow> {
  const { data, error } = await supabase
    .from('conversation_notes')
    .insert({ tenant_id: workspaceId, conversation_id: conversationId, body, created_by: createdBy })
    .select('*')
    .single()
  if (error) throw mapPostgrestError(error)
  return data as ConversationNoteRow
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface InsertMessageInput {
  conversationId: string
  channelConnectionId: string
  direction: 'inbound' | 'outbound'
  messageType: 'text' | 'template' | 'media' | 'interactive' | 'system'
  body?: string | null
  channelTemplateId?: string | null
  providerMessageId?: string | null
  status: string
  errorCode?: string | null
  errorMessage?: string | null
  sentByUserId?: string | null
  metadata?: Record<string, unknown>
  occurredAt?: string
}

export async function listMessages(
  supabase: SupabaseClient,
  workspaceId: string,
  conversationId: string,
  params: ListParams,
): Promise<Page<MessageRow>> {
  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1

  const { data, error, count } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT, { count: 'exact' })
    .eq('tenant_id', workspaceId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw mapPostgrestError(error)

  return {
    items: (data ?? []) as unknown as MessageRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function insertMessage(
  supabase: SupabaseClient,
  workspaceId: string,
  input: InsertMessageInput,
): Promise<MessageRow> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      tenant_id: workspaceId,
      conversation_id: input.conversationId,
      channel_connection_id: input.channelConnectionId,
      direction: input.direction,
      message_type: input.messageType,
      body: input.body ?? null,
      channel_template_id: input.channelTemplateId ?? null,
      provider_message_id: input.providerMessageId ?? null,
      status: input.status,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      sent_by_user_id: input.sentByUserId ?? null,
      metadata: input.metadata ?? {},
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select(MESSAGE_SELECT)
    .single()
  if (error) throw mapPostgrestError(error)
  return data as unknown as MessageRow
}

export async function findMessageByProviderMessageId(
  supabase: SupabaseClient,
  channelConnectionId: string,
  providerMessageId: string,
): Promise<MessageRow | null> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('channel_connection_id', channelConnectionId)
    .eq('provider_message_id', providerMessageId)
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  return (data as unknown as MessageRow) ?? null
}

/** Idempotent insert for inbound messages -- providers retry webhook delivery on any non-200/
 * timeout, so a redelivered event must not create a duplicate message row. */
export async function insertInboundMessageIdempotent(
  supabase: SupabaseClient,
  workspaceId: string,
  input: InsertMessageInput,
): Promise<{ message: MessageRow; isNew: boolean }> {
  if (input.providerMessageId) {
    const existing = await findMessageByProviderMessageId(supabase, input.channelConnectionId, input.providerMessageId)
    if (existing) return { message: existing, isNew: false }
  }
  try {
    const message = await insertMessage(supabase, workspaceId, input)
    return { message, isNew: true }
  } catch (err) {
    if (err instanceof ConflictError && input.providerMessageId) {
      const existing = await findMessageByProviderMessageId(supabase, input.channelConnectionId, input.providerMessageId)
      if (existing) return { message: existing, isNew: false }
    }
    throw err
  }
}

export async function insertAttachment(
  supabase: SupabaseClient,
  workspaceId: string,
  messageId: string,
  input: { contentType: string; storagePath: string; fileName?: string; fileSizeBytes?: number; providerMediaId?: string },
): Promise<void> {
  const { error } = await supabase.from('message_attachments').insert({
    tenant_id: workspaceId,
    message_id: messageId,
    content_type: input.contentType,
    storage_path: input.storagePath,
    file_name: input.fileName ?? null,
    file_size_bytes: input.fileSizeBytes ?? null,
    provider_media_id: input.providerMediaId ?? null,
  })
  if (error) throw mapPostgrestError(error)
}

const STATUS_RANK: Record<string, number> = { queued: 0, sent: 1, delivered: 2, read: 3 }

export async function insertMessageStatusEvent(
  supabase: SupabaseClient,
  workspaceId: string,
  messageId: string,
  status: string,
  errorCode: string | null,
  errorMessage: string | null,
  occurredAt: string,
  rawPayload: unknown,
): Promise<void> {
  const { error } = await supabase.from('message_status_events').insert({
    tenant_id: workspaceId,
    message_id: messageId,
    status,
    error_code: errorCode,
    error_message: errorMessage,
    occurred_at: occurredAt,
    raw_payload: rawPayload,
  })
  if (error) throw mapPostgrestError(error)
}

/** Advances messages.status only forward (queued < sent < delivered < read, failed terminal).
 * Returns true iff the status actually changed, so the caller knows whether to emit a domain event. */
export async function advanceMessageStatus(
  supabase: SupabaseClient,
  messageId: string,
  currentStatus: string,
  newStatus: string,
): Promise<boolean> {
  if (newStatus === 'failed') {
    if (currentStatus === 'failed') return false
    const { error } = await supabase.from('messages').update({ status: 'failed' }).eq('id', messageId)
    if (error) throw mapPostgrestError(error)
    return true
  }
  const currentRank = STATUS_RANK[currentStatus] ?? -1
  const newRank = STATUS_RANK[newStatus] ?? -1
  if (newRank <= currentRank) return false

  const { error } = await supabase.from('messages').update({ status: newStatus }).eq('id', messageId)
  if (error) throw mapPostgrestError(error)
  return true
}

// ---------------------------------------------------------------------------
// Channel identities + conversation resolution (used by the webhook ingest flow)
// ---------------------------------------------------------------------------

export async function findOrCreateChannelIdentity(
  supabase: SupabaseClient,
  workspaceId: string,
  channelType: ChannelType,
  value: string,
): Promise<ChannelIdentityRow> {
  const { data: existing, error: findError } = await supabase
    .from('channel_identities')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('channel_type', channelType)
    .eq('value', value)
    .maybeSingle()
  if (findError) throw mapPostgrestError(findError)

  if (existing) {
    const { data, error } = await supabase
      .from('channel_identities')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw mapPostgrestError(error)
    return data as ChannelIdentityRow
  }

  const { data, error } = await supabase
    .from('channel_identities')
    .insert({ tenant_id: workspaceId, channel_type: channelType, value })
    .select('*')
    .single()
  if (error) throw mapPostgrestError(error)
  return data as ChannelIdentityRow
}

export async function findLiveConversationForIdentity(
  supabase: SupabaseClient,
  workspaceId: string,
  channelIdentityId: string,
): Promise<ConversationRow | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('channel_identity_id', channelIdentityId)
    .neq('status', 'closed')
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  return (data as unknown as ConversationRow) ?? null
}

export async function createConversation(
  supabase: SupabaseClient,
  workspaceId: string,
  input: { channelIdentityId: string; contactId: string | null; channelConnectionId: string; channelType: ChannelType },
): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      tenant_id: workspaceId,
      channel_identity_id: input.channelIdentityId,
      contact_id: input.contactId,
      channel_connection_id: input.channelConnectionId,
      channel_type: input.channelType,
    })
    .select(CONVERSATION_SELECT)
    .single()
  if (error) throw mapPostgrestError(error)
  return data as unknown as ConversationRow
}
