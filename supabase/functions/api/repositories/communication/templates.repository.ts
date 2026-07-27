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

/** Read/sync only -- see docs/modules/marketing/templates.md. No create/update here this pass. */
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
