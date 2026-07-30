import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { mapPostgrestError, NotFoundError } from '../../../_shared/errors.ts'
import type { CreateTemplateInput } from '../../schemas/communication/templates.schemas.ts'

export interface TemplateRow {
  id: string
  tenant_id: string
  name: string
  purpose: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ChannelTemplateRow {
  id: string
  tenant_id: string
  template_id: string
  channel_connection_id: string
  channel_type: string
  provider_template_name: string
  language_code: string
  category: string | null
  body: string | null
  variables: unknown[]
  status: string
  provider_template_id: string | null
  created_at: string
  updated_at: string
}

export async function list(supabase: SupabaseClient, workspaceId: string): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as TemplateRow[]
}

export async function getByIdOrThrow(supabase: SupabaseClient, workspaceId: string, id: string): Promise<TemplateRow> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  if (!data) throw new NotFoundError('Template not found')
  return data as TemplateRow
}

export async function create(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateTemplateInput,
  createdBy: string,
): Promise<TemplateRow> {
  const { data, error } = await supabase
    .from('templates')
    .insert({ tenant_id: workspaceId, name: input.name, purpose: input.purpose ?? null, created_by: createdBy })
    .select('*')
    .single()
  if (error) throw mapPostgrestError(error)
  return data as TemplateRow
}

export async function remove(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}

export async function listChannelTemplates(
  supabase: SupabaseClient,
  workspaceId: string,
  templateId: string,
): Promise<ChannelTemplateRow[]> {
  const { data, error } = await supabase
    .from('channel_templates')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as ChannelTemplateRow[]
}

/** For the Inbox composer's "Send Template" picker -- every template synced for a specific
 * connection, regardless of which business `templates` row it's linked to. */
export async function listChannelTemplatesByConnection(
  supabase: SupabaseClient,
  workspaceId: string,
  channelConnectionId: string,
): Promise<ChannelTemplateRow[]> {
  const { data, error } = await supabase
    .from('channel_templates')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('channel_connection_id', channelConnectionId)
    .order('provider_template_name', { ascending: true })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as ChannelTemplateRow[]
}

/** Resolved right before sending -- confirms the requested template is real, approved, and
 * belongs to this conversation's own connection before anything reaches Meta. */
export async function findChannelTemplateByName(
  supabase: SupabaseClient,
  workspaceId: string,
  channelConnectionId: string,
  providerTemplateName: string,
  languageCode: string,
): Promise<ChannelTemplateRow | null> {
  const { data, error } = await supabase
    .from('channel_templates')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('channel_connection_id', channelConnectionId)
    .eq('provider_template_name', providerTemplateName)
    .eq('language_code', languageCode)
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  return (data as ChannelTemplateRow | null) ?? null
}

/** Matches an existing business `templates` row by name (case-insensitive) so syncing from Meta
 * doesn't force pre-creating one row per Meta template first; creates one if none matches. */
export async function findOrCreateTemplateByName(
  supabase: SupabaseClient,
  workspaceId: string,
  name: string,
  createdBy: string,
): Promise<TemplateRow> {
  const { data: existing, error: findError } = await supabase
    .from('templates')
    .select('*')
    .eq('tenant_id', workspaceId)
    .ilike('name', name)
    .maybeSingle()
  if (findError) throw mapPostgrestError(findError)
  if (existing) return existing as TemplateRow

  const { data, error } = await supabase
    .from('templates')
    .insert({ tenant_id: workspaceId, name, purpose: null, created_by: createdBy })
    .select('*')
    .single()
  if (error) throw mapPostgrestError(error)
  return data as TemplateRow
}

export interface UpsertChannelTemplateInput {
  templateId: string
  channelConnectionId: string
  channelType: string
  providerTemplateName: string
  languageCode: string
  category: string | null
  body: string | null
  variables: unknown[]
  status: string
  providerTemplateId: string | null
}

/** Keyed by the existing unique constraint (tenant_id, channel_connection_id,
 * provider_template_name, language_code) -- re-syncing updates status/body/variables in place
 * rather than duplicating rows. */
export async function upsertChannelTemplate(
  supabase: SupabaseClient,
  workspaceId: string,
  input: UpsertChannelTemplateInput,
): Promise<ChannelTemplateRow> {
  const { data, error } = await supabase
    .from('channel_templates')
    .upsert(
      {
        tenant_id: workspaceId,
        template_id: input.templateId,
        channel_connection_id: input.channelConnectionId,
        channel_type: input.channelType,
        provider_template_name: input.providerTemplateName,
        language_code: input.languageCode,
        category: input.category,
        body: input.body,
        variables: input.variables,
        status: input.status,
        provider_template_id: input.providerTemplateId,
      },
      { onConflict: 'tenant_id,channel_connection_id,provider_template_name,language_code' },
    )
    .select('*')
    .single()
  if (error) throw mapPostgrestError(error)
  return data as ChannelTemplateRow
}
