import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { mapPostgrestError, NotFoundError } from '../../../_shared/errors.ts'
import type { ListParams, Page } from '../../../_shared/repository.ts'
import type { CreateTaskInput, UpdateTaskInput } from '../../schemas/crm/tasks.schemas.ts'
import type { TaskRow } from '../../mappers/crm/tasks.mapper.ts'

const TASK_SELECT = '*, contacts(id, first_name, last_name)'

interface ListTasksParams extends ListParams {
  status?: string
  assignedToUserId?: string
  contactId?: string
}

async function getByIdOrThrow(supabase: SupabaseClient, workspaceId: string, id: string): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .maybeSingle()

  if (error) throw mapPostgrestError(error)
  if (!data) throw new NotFoundError('Task not found')
  return data as unknown as TaskRow
}

export async function listByContact(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string,
): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('tenant_id', workspaceId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })

  if (error) throw mapPostgrestError(error)
  return (data ?? []) as unknown as TaskRow[]
}

export async function list(
  supabase: SupabaseClient,
  workspaceId: string,
  params: ListTasksParams,
): Promise<Page<TaskRow>> {
  let query = supabase.from('tasks').select(TASK_SELECT, { count: 'exact' }).eq('tenant_id', workspaceId)

  if (params.status) query = query.eq('status', params.status)
  if (params.assignedToUserId) query = query.eq('assigned_to_user_id', params.assignedToUserId)
  if (params.contactId) query = query.eq('contact_id', params.contactId)

  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1
  query = query.order('due_at', { ascending: true, nullsFirst: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw mapPostgrestError(error)

  return {
    items: (data ?? []) as unknown as TaskRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function create(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string,
  input: CreateTaskInput,
  createdBy: string,
): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      tenant_id: workspaceId,
      contact_id: contactId,
      title: input.title,
      description: input.description ?? null,
      due_at: input.dueAt ?? null,
      assigned_to_user_id: input.assignedToUserId ?? null,
      created_by: createdBy,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) throw mapPostgrestError(error)
  return getByIdOrThrow(supabase, workspaceId, data.id)
}

export async function update(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  input: UpdateTaskInput,
): Promise<TaskRow> {
  const updates: Record<string, unknown> = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.description !== undefined) updates.description = input.description
  if (input.dueAt !== undefined) updates.due_at = input.dueAt
  if (input.assignedToUserId !== undefined) updates.assigned_to_user_id = input.assignedToUserId
  if (input.status !== undefined) {
    updates.status = input.status
    updates.completed_at = input.status === 'completed' ? new Date().toISOString() : null
  }

  const { error } = await supabase.from('tasks').update(updates).eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
  return getByIdOrThrow(supabase, workspaceId, id)
}

export async function remove(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}
