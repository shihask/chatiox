import type { MeDTO, SessionDTO, SessionMembershipDTO } from '../dtos/auth.dtos.ts'

interface SupabaseSessionLike {
  access_token: string
  refresh_token: string
  expires_at?: number
}

interface SupabaseUserLike {
  id: string
  email?: string | null
}

export function toSessionDTO(input: {
  user: SupabaseUserLike
  session: SupabaseSessionLike
  memberships: SessionMembershipDTO[]
}): SessionDTO {
  return {
    accessToken: input.session.access_token,
    refreshToken: input.session.refresh_token,
    expiresAt: input.session.expires_at
      ? new Date(input.session.expires_at * 1000).toISOString()
      : new Date().toISOString(),
    user: { id: input.user.id, email: input.user.email ?? '' },
    memberships: input.memberships,
  }
}

export function toMeDTO(input: { user: SupabaseUserLike; memberships: SessionMembershipDTO[] }): MeDTO {
  return {
    user: { id: input.user.id, email: input.user.email ?? '' },
    memberships: input.memberships,
  }
}
