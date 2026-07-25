import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { mapPostgrestError } from '../../../_shared/errors.ts'
import type { NoteRow } from '../../mappers/crm/notes.mapper.ts'

export async function listByContact(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string,
): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })

  if (error) throw mapPostgrestError(error)
  return (data ?? []) as NoteRow[]
}

export async function create(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string,
  body: string,
  createdBy: string,
): Promise<NoteRow> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ tenant_id: workspaceId, contact_id: contactId, body, created_by: createdBy })
    .select()
    .single<NoteRow>()

  if (error) throw mapPostgrestError(error)
  return data
}

export async function remove(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}
