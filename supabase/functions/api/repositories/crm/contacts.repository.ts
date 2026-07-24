import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { mapPostgrestError, NotFoundError } from '../../../_shared/errors.ts'
import { normalizeChannelValue } from '../../../_shared/channelValue.ts'
import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { ListParams, Page } from '../../../_shared/repository.ts'
import type {
  AddContactChannelInput,
  CreateContactInput,
  UpdateContactChannelInput,
  UpdateContactInput,
} from '../../schemas/crm/contacts.schemas.ts'
import type { ContactChannelRow, ContactRow, LeadSourceRow, LeadStatusRow } from '../../mappers/crm/contacts.mapper.ts'

const CONTACT_SELECT = '*, contact_channels(*), lead_statuses(*), lead_sources(*)'

/** Strips characters with special meaning in PostgREST's .or() filter DSL (comma, parens) so a
 * search term can never corrupt or extend the filter -- see list() below. */
function sanitizeForFilter(value: string): string {
  return value.replace(/[,()]/g, '')
}

interface ListContactsParams extends ListParams {
  leadStatusId?: string
  leadSourceId?: string
  assignedToUserId?: string
}

export async function list(
  supabase: SupabaseClient,
  workspaceId: string,
  params: ListContactsParams,
): Promise<Page<ContactRow>> {
  let query = supabase
    .from('contacts')
    .select(CONTACT_SELECT, { count: 'exact' })
    .eq('tenant_id', workspaceId)
    .is('deleted_at', null)

  if (params.leadStatusId) query = query.eq('lead_status_id', params.leadStatusId)
  if (params.leadSourceId) query = query.eq('lead_source_id', params.leadSourceId)
  if (params.assignedToUserId) query = query.eq('assigned_to_user_id', params.assignedToUserId)

  if (params.search) {
    const term = sanitizeForFilter(params.search)

    const { data: channelMatches } = await supabase
      .from('contact_channels')
      .select('contact_id')
      .eq('tenant_id', workspaceId)
      .is('deleted_at', null)
      .ilike('value', `%${term}%`)

    const matchingContactIds = (channelMatches ?? []).map((row: { contact_id: string }) => row.contact_id)
    const idFilter = matchingContactIds.length > 0 ? `,id.in.(${matchingContactIds.join(',')})` : ''

    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,tags.cs.{${term}}${idFilter}`)
  }

  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw mapPostgrestError(error)

  return {
    items: (data ?? []) as unknown as ContactRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function getById(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
): Promise<ContactRow | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select(CONTACT_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw mapPostgrestError(error)
  return data as unknown as ContactRow | null
}

async function getByIdOrThrow(supabase: SupabaseClient, workspaceId: string, id: string): Promise<ContactRow> {
  const row = await getById(supabase, workspaceId, id)
  if (!row) throw new NotFoundError('Contact not found')
  return row
}

export async function create(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateContactInput,
): Promise<ContactRow> {
  const { data, error } = await supabase
    .rpc('create_contact_with_channels', {
      tenant_id: workspaceId,
      p_first_name: input.firstName,
      p_last_name: input.lastName ?? null,
      p_tags: input.tags ?? [],
      p_channels: input.channels.map((channel) => ({
        channel_type: channel.channelType,
        value: normalizeChannelValue(channel.channelType, channel.value),
        is_primary: channel.isPrimary ?? false,
      })),
      p_lead_status_id: input.leadStatusId ?? null,
      p_lead_source_id: input.leadSourceId ?? null,
      p_assigned_to_user_id: input.assignedToUserId ?? null,
    })
    .single<{ id: string }>()

  if (error) throw mapPostgrestError(error)
  return getByIdOrThrow(supabase, workspaceId, data.id)
}

export async function update(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  input: UpdateContactInput,
): Promise<ContactRow> {
  const updates: Record<string, unknown> = {}
  if (input.firstName !== undefined) updates.first_name = input.firstName
  if (input.lastName !== undefined) updates.last_name = input.lastName
  if (input.tags !== undefined) updates.tags = input.tags
  if (input.leadStatusId !== undefined) updates.lead_status_id = input.leadStatusId
  if (input.leadSourceId !== undefined) updates.lead_source_id = input.leadSourceId
  if (input.assignedToUserId !== undefined) updates.assigned_to_user_id = input.assignedToUserId

  const { error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) throw mapPostgrestError(error)
  return getByIdOrThrow(supabase, workspaceId, id)
}

export async function remove(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_contact', {
    tenant_id: workspaceId,
    p_contact_id: id,
  })
  if (error) throw mapPostgrestError(error)
}

export async function addChannel(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string,
  input: AddContactChannelInput,
): Promise<ContactChannelRow> {
  const { data, error } = await supabase
    .from('contact_channels')
    .insert({
      tenant_id: workspaceId,
      contact_id: contactId,
      channel_type: input.channelType,
      value: normalizeChannelValue(input.channelType, input.value),
      is_primary: input.isPrimary ?? false,
    })
    .select()
    .single<ContactChannelRow>()

  if (error) throw mapPostgrestError(error)
  return data
}

export async function updateChannel(
  supabase: SupabaseClient,
  workspaceId: string,
  channelId: string,
  input: UpdateContactChannelInput,
): Promise<ContactChannelRow> {
  const updates: Record<string, unknown> = {}
  if (input.value !== undefined) {
    // Normalizing requires knowing the channel's type -- fetch it first.
    const { data: existing, error: fetchError } = await supabase
      .from('contact_channels')
      .select('channel_type')
      .eq('tenant_id', workspaceId)
      .eq('id', channelId)
      .maybeSingle<{ channel_type: ChannelType }>()
    if (fetchError) throw mapPostgrestError(fetchError)
    if (!existing) throw new NotFoundError('Contact channel not found')
    updates.value = normalizeChannelValue(existing.channel_type, input.value)
  }
  if (input.isPrimary !== undefined) updates.is_primary = input.isPrimary

  const { data, error } = await supabase
    .from('contact_channels')
    .update(updates)
    .eq('tenant_id', workspaceId)
    .eq('id', channelId)
    .select()
    .single<ContactChannelRow>()

  if (error) throw mapPostgrestError(error)
  return data
}

export async function removeChannel(supabase: SupabaseClient, workspaceId: string, channelId: string): Promise<void> {
  const { error } = await supabase
    .from('contact_channels')
    .delete()
    .eq('tenant_id', workspaceId)
    .eq('id', channelId)
  if (error) throw mapPostgrestError(error)
}

export async function listLeadStatuses(supabase: SupabaseClient, workspaceId: string): Promise<LeadStatusRow[]> {
  const { data, error } = await supabase
    .from('lead_statuses')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('sort_order', { ascending: true })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as LeadStatusRow[]
}

export async function listLeadSources(supabase: SupabaseClient, workspaceId: string): Promise<LeadSourceRow[]> {
  const { data, error } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('sort_order', { ascending: true })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as LeadSourceRow[]
}
