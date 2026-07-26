import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { mapPostgrestError } from '../../../_shared/errors.ts'
import type { ListParams, Page } from '../../../_shared/repository.ts'
import type { NoteRow } from '../../mappers/crm/notes.mapper.ts'

const NOTE_SELECT = '*, contacts(id, first_name, last_name)'

interface ListNotesParams extends ListParams {
  contactId?: string
  authorId?: string
}

export async function listByContact(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string,
): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })

  if (error) throw mapPostgrestError(error)
  return (data ?? []) as unknown as NoteRow[]
}

export async function list(
  supabase: SupabaseClient,
  workspaceId: string,
  params: ListNotesParams,
): Promise<Page<NoteRow>> {
  let query = supabase.from('notes').select(NOTE_SELECT, { count: 'exact' }).eq('tenant_id', workspaceId)

  if (params.contactId) query = query.eq('contact_id', params.contactId)
  if (params.authorId) query = query.eq('created_by', params.authorId)
  if (params.search) query = query.ilike('body', `%${params.search}%`)

  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw mapPostgrestError(error)

  return {
    items: (data ?? []) as unknown as NoteRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  }
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
    .select(NOTE_SELECT)
    .single()

  if (error) throw mapPostgrestError(error)
  return data as unknown as NoteRow
}

export async function remove(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}
