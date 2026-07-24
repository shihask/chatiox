import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { ConflictError, InternalError, UnauthorizedError } from '../../_shared/errors.ts'
import type { WorkspaceRole } from '../../_shared/http/requestContext.ts'
import type { SessionMembershipDTO } from '../dtos/auth.dtos.ts'

export interface CreatedUserWithWorkspace {
  userId: string
  email: string
  workspaceId: string
  workspaceName: string
  role: WorkspaceRole
}

interface TenantWithOwnerRpcResult {
  tenant_id: string
  role: WorkspaceRole
}

/** Admin-creates the auth.users row (email pre-confirmed, see docs/architecture.md) and provisions
 * the owning workspace via create_tenant_with_owner() -- the only place tenant creation happens. */
export async function createUserWithWorkspace(
  serviceRoleClient: SupabaseClient,
  input: { email: string; password: string; companyName: string },
): Promise<CreatedUserWithWorkspace> {
  const { data: created, error: createError } = await serviceRoleClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })
  if (createError || !created.user) {
    if (createError?.code === 'email_exists') {
      throw new ConflictError('An account with this email already exists')
    }
    throw new InternalError(createError?.message ?? 'Failed to create user')
  }

  const { data: tenantResult, error: rpcError } = await serviceRoleClient
    .rpc('create_tenant_with_owner', {
      p_user_id: created.user.id,
      p_tenant_name: input.companyName,
    })
    .single<TenantWithOwnerRpcResult>()
  if (rpcError || !tenantResult) {
    throw new InternalError(rpcError?.message ?? 'Failed to provision workspace')
  }

  return {
    userId: created.user.id,
    email: created.user.email ?? input.email,
    workspaceId: tenantResult.tenant_id,
    workspaceName: input.companyName,
    role: tenantResult.role,
  }
}

export async function signInWithPassword(
  anonClient: SupabaseClient,
  input: { email: string; password: string },
) {
  const { data, error } = await anonClient.auth.signInWithPassword(input)
  if (error || !data.session) throw new UnauthorizedError('Invalid email or password')
  return data.session
}

export async function refreshSession(anonClient: SupabaseClient, refreshToken: string) {
  const { data, error } = await anonClient.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) throw new UnauthorizedError('Invalid or expired refresh token')
  return data.session
}

interface TenantMembershipRow {
  tenant_id: string
  role: WorkspaceRole
  tenants: { name: string } | null
}

/** RLS-scoped by the caller's own JWT (get_my_tenant_ids() = auth.uid()'s memberships) -- must be
 * called with a user-scoped client, never service-role, or it would need an explicit user filter. */
export async function listMemberships(
  userScopedClient: SupabaseClient,
): Promise<SessionMembershipDTO[]> {
  const { data, error } = await userScopedClient
    .from('tenant_memberships')
    .select('tenant_id, role, tenants(name)')
  if (error) throw new InternalError(error.message)

  return ((data ?? []) as unknown as TenantMembershipRow[]).map((row) => ({
    workspaceId: row.tenant_id,
    workspaceName: row.tenants?.name ?? '',
    role: row.role,
  }))
}
