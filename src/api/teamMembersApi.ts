import { apiClient } from '@/api/apiClient'
import type {
  CreateInviteDTO,
  InvitePreviewDTO,
  TeamInviteDTO,
  TeamMemberDTO,
  UpdateMemberRoleDTO,
} from '@/features/administration/team-members/types/team-member.types'

export const teamMembersApi = {
  listMembers: () => apiClient.get<TeamMemberDTO[]>('/team-members'),
  updateMemberRole: async (userId: string, input: UpdateMemberRoleDTO): Promise<void> => {
    await apiClient.patch(`/team-members/${userId}`, input)
  },
  removeMember: async (userId: string): Promise<void> => {
    await apiClient.delete(`/team-members/${userId}`)
  },

  listInvites: () => apiClient.get<TeamInviteDTO[]>('/team-invites'),
  createInvite: (input: CreateInviteDTO) => apiClient.post<TeamInviteDTO>('/team-invites', input),
  revokeInvite: async (id: string): Promise<void> => {
    await apiClient.delete(`/team-invites/${id}`)
  },

  previewInvite: (token: string) => apiClient.get<InvitePreviewDTO>(`/invites/${token}`),
}
