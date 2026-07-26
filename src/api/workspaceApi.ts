import { apiClient } from '@/api/apiClient'
import type { LeadSourceDTO, LeadStatusDTO } from '@/features/crm/contacts/types/contact.types'
import type { WorkspaceProfileDTO } from '@/features/administration/workspace/types/workspace.types'

export interface CreateLeadStatusInput {
  name: string
  isWon?: boolean
  isLost?: boolean
}

export interface UpdateLeadStatusInput {
  name?: string
  isWon?: boolean
  isLost?: boolean
}

export const workspaceApi = {
  update: (name: string) => apiClient.patch<WorkspaceProfileDTO>('/workspace', { name }),

  createLeadStatus: (input: CreateLeadStatusInput) =>
    apiClient.post<LeadStatusDTO>('/lead-statuses', input),
  updateLeadStatus: (id: string, input: UpdateLeadStatusInput) =>
    apiClient.patch<LeadStatusDTO>(`/lead-statuses/${id}`, input),
  removeLeadStatus: async (id: string): Promise<void> => {
    await apiClient.delete(`/lead-statuses/${id}`)
  },

  createLeadSource: (name: string) => apiClient.post<LeadSourceDTO>('/lead-sources', { name }),
  updateLeadSource: (id: string, name: string) =>
    apiClient.patch<LeadSourceDTO>(`/lead-sources/${id}`, { name }),
  removeLeadSource: async (id: string): Promise<void> => {
    await apiClient.delete(`/lead-sources/${id}`)
  },
}
