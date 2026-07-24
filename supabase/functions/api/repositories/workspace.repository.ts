import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { InternalError } from '../../_shared/errors.ts'
import type { WorkspaceRole } from '../../_shared/http/requestContext.ts'

/**
 * The tenant_id <-> workspaceId translation firewall (see docs/architecture.md §2) -- flat forever,
 * cross-domain infra like Auth, since every domain's repository needs this identically.
 * Returns null if the caller is not a member of the workspace (get_my_role finds no matching row).
 */
export async function getMyRole(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const { data, error } = await supabase.rpc('get_my_role', { tenant_id: workspaceId })
  if (error) throw new InternalError(error.message)
  return (data as WorkspaceRole | null) ?? null
}
