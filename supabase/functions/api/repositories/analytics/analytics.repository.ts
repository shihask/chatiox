import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { mapPostgrestError } from '../../../_shared/errors.ts'
import type { LeadsBySourceRow, LeadStatusDistributionRow } from '../../mappers/analytics/analytics.mapper.ts'

export async function getLeadsBySource(supabase: SupabaseClient, workspaceId: string): Promise<LeadsBySourceRow[]> {
  const { data, error } = await supabase.rpc('get_leads_by_source', { tenant_id: workspaceId })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as LeadsBySourceRow[]
}

export async function getLeadStatusDistribution(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<LeadStatusDistributionRow[]> {
  const { data, error } = await supabase.rpc('get_lead_status_distribution', { tenant_id: workspaceId })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as LeadStatusDistributionRow[]
}
