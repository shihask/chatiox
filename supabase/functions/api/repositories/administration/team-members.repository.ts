import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { createServiceRoleClient } from '../../../_shared/supabaseClient.ts'
import { mapPostgrestError } from '../../../_shared/errors.ts'
import type { WorkspaceRole } from '../../../_shared/http/requestContext.ts'
import type { CreateInviteInput } from '../../schemas/administration/team-members.schemas.ts'

export interface MembershipRow {
  user_id: string
  role: WorkspaceRole
  created_at: string
}

export interface MemberWithEmailRow extends MembershipRow {
  email: string
}

export interface InviteRow {
  id: string
  tenant_id: string
  email: string
  role: WorkspaceRole
  token: string
  status: 'pending' | 'accepted'
  invited_by: string | null
  created_at: string
  expires_at: string
}

export interface InviteWithWorkspaceRow extends InviteRow {
  tenants: { name: string } | null
}

/** auth.users isn't exposed via PostgREST, so member emails are resolved one-by-one through the
 * Admin API using a service-role client -- fine at the small team sizes Phase 2 targets. */
export async function listMembers(supabase: SupabaseClient, workspaceId: string): Promise<MemberWithEmailRow[]> {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('user_id, role, created_at')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: true })
  if (error) throw mapPostgrestError(error)

  const serviceRoleClient = createServiceRoleClient()
  const rows = (data ?? []) as MembershipRow[]
  return Promise.all(
    rows.map(async (row) => {
      const { data: userData } = await serviceRoleClient.auth.admin.getUserById(row.user_id)
      return { ...row, email: userData.user?.email ?? 'unknown' }
    }),
  )
}

export async function updateMemberRole(
  supabase: SupabaseClient,
  workspaceId: string,
  targetUserId: string,
  role: WorkspaceRole,
): Promise<void> {
  const { error } = await supabase.rpc('update_member_role', {
    p_tenant_id: workspaceId,
    p_target_user_id: targetUserId,
    p_new_role: role,
  })
  if (error) throw mapPostgrestError(error)
}

export async function removeMember(supabase: SupabaseClient, workspaceId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_member', {
    p_tenant_id: workspaceId,
    p_target_user_id: targetUserId,
  })
  if (error) throw mapPostgrestError(error)
}

export async function listInvites(supabase: SupabaseClient, workspaceId: string): Promise<InviteRow[]> {
  const { data, error } = await supabase
    .from('tenant_invites')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw mapPostgrestError(error)
  return (data ?? []) as InviteRow[]
}

export async function createInvite(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateInviteInput,
  invitedBy: string,
): Promise<InviteRow> {
  const { data, error } = await supabase
    .from('tenant_invites')
    .insert({ tenant_id: workspaceId, email: input.email.toLowerCase(), role: input.role, invited_by: invitedBy })
    .select()
    .single<InviteRow>()
  if (error) throw mapPostgrestError(error)
  return data
}

export async function revokeInvite(supabase: SupabaseClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await supabase.from('tenant_invites').delete().eq('tenant_id', workspaceId).eq('id', id)
  if (error) throw mapPostgrestError(error)
}

/** Public lookup (unauthenticated signup page preview) -- always via service-role client. */
export async function findPendingInviteByToken(
  serviceRoleClient: SupabaseClient,
  token: string,
): Promise<InviteWithWorkspaceRow | null> {
  const { data, error } = await serviceRoleClient
    .from('tenant_invites')
    .select('*, tenants(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle()
  if (error) throw mapPostgrestError(error)
  return data as unknown as InviteWithWorkspaceRow | null
}

export async function acceptInvite(serviceRoleClient: SupabaseClient, inviteId: string): Promise<void> {
  const { error } = await serviceRoleClient
    .from('tenant_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', inviteId)
  if (error) throw mapPostgrestError(error)
}
