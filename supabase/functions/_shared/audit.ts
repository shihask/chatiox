import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export interface RecordAuditInput {
  workspaceId: string
  actorUserId: string
  action: string
  targetType: string
  targetId?: string
  metadata?: Record<string, unknown>
}

/** Writes via the record_audit_log() RPC so no client can forge an entry. Must never break the
 * primary operation -- failures are logged, not thrown. */
export async function recordAudit(supabase: SupabaseClient, input: RecordAuditInput): Promise<void> {
  const { error } = await supabase.rpc('record_audit_log', {
    tenant_id: input.workspaceId,
    actor_user_id: input.actorUserId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  })
  if (error) console.error('[audit] failed to record audit log', error)
}
