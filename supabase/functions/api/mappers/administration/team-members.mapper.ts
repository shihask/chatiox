import type { TeamInviteDTO, TeamMemberDTO } from '../../dtos/administration/team-members.dtos.ts'
import type { InviteRow, MemberWithEmailRow } from '../../repositories/administration/team-members.repository.ts'

export function mapMemberRowToDTO(row: MemberWithEmailRow): TeamMemberDTO {
  return {
    userId: row.user_id,
    email: row.email,
    role: row.role,
    joinedAt: row.created_at,
  }
}

export function mapInviteRowToDTO(row: InviteRow): TeamInviteDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    email: row.email,
    role: row.role,
    status: row.status,
    token: row.token,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}
