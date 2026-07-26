import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { mapPostgrestError, NotFoundError } from '../../../_shared/errors.ts'
import type {
  CreateLeadSourceInput,
  CreateLeadStatusInput,
  UpdateLeadSourceInput,
  UpdateLeadStatusInput,
} from '../../schemas/administration/workspace.schemas.ts'
import type { LeadSourceRow, LeadStatusRow } from '../../mappers/crm/contacts.mapper.ts'

interface TenantRow {
  id: string
  name: string
  slug: string
}

async function nextSortOrder(supabase: SupabaseClient, table: string, workspaceId: string): Promise<number> {
  const { data, error } = await supabase
    .from(table)
    .select('sort_order')
    .eq('tenant_id', workspaceId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>()
  if (error) throw mapPostgrestError(error)
  return (data?.sort_order ?? 0) + 10
}

export async function updateWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  name: string,
): Promise<TenantRow> {
  const { data, error } = await supabase
    .from('tenants')
    .update({ name })
    .eq('id', workspaceId)
    .select()
    .single<TenantRow>()
  if (error) throw mapPostgrestError(error)
  return data
}

export async function createLeadStatus(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateLeadStatusInput,
): Promise<LeadStatusRow> {
  const sortOrder = await nextSortOrder(supabase, 'lead_statuses', workspaceId)
  const { data, error } = await supabase
    .from('lead_statuses')
    .insert({
      tenant_id: workspaceId,
      name: input.name,
      sort_order: sortOrder,
      is_won: input.isWon ?? false,
      is_lost: input.isLost ?? false,
    })
    .select()
    .single<LeadStatusRow>()
  if (error) throw mapPostgrestError(error)
  return data
}

/** At most one status is ever "won" (same for "lost") -- Analytics' won/lost counts assume this.
 * Clearing every other row's flag before setting this one enforces it as a real invariant instead
 * of just a UI hint. */
async function clearFlagOnOtherStatuses(
  supabase: SupabaseClient,
  workspaceId: string,
  exceptId: string,
  column: 'is_won' | 'is_lost',
): Promise<void> {
  const { error } = await supabase
    .from('lead_statuses')
    .update({ [column]: false })
    .eq('tenant_id', workspaceId)
    .eq(column, true)
    .neq('id', exceptId)
  if (error) throw mapPostgrestError(error)
}

export async function updateLeadStatus(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  input: UpdateLeadStatusInput,
): Promise<LeadStatusRow> {
  if (input.isWon === true) await clearFlagOnOtherStatuses(supabase, workspaceId, id, 'is_won')
  if (input.isLost === true) await clearFlagOnOtherStatuses(supabase, workspaceId, id, 'is_lost')

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.isWon !== undefined) updates.is_won = input.isWon
  if (input.isLost !== undefined) updates.is_lost = input.isLost

  const { data, error } = await supabase
    .from('lead_statuses')
    .update(updates)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .select()
    .maybeSingle<LeadStatusRow>()
  if (error) throw mapPostgrestError(error)
  if (!data) throw new NotFoundError('Lead status not found')
  return data
}

export async function deleteLeadStatus(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('lead_statuses').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}

export async function createLeadSource(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateLeadSourceInput,
): Promise<LeadSourceRow> {
  const sortOrder = await nextSortOrder(supabase, 'lead_sources', workspaceId)
  const { data, error } = await supabase
    .from('lead_sources')
    .insert({ tenant_id: workspaceId, name: input.name, sort_order: sortOrder })
    .select()
    .single<LeadSourceRow>()
  if (error) throw mapPostgrestError(error)
  return data
}

export async function updateLeadSource(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  input: UpdateLeadSourceInput,
): Promise<LeadSourceRow> {
  const { data, error } = await supabase
    .from('lead_sources')
    .update({ name: input.name })
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .select()
    .maybeSingle<LeadSourceRow>()
  if (error) throw mapPostgrestError(error)
  if (!data) throw new NotFoundError('Lead source not found')
  return data
}

export async function deleteLeadSource(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('lead_sources').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}
