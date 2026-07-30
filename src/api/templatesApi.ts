import { apiClient } from '@/api/apiClient'
import type {
  ChannelTemplateDTO,
  CreateTemplateDTO,
  TemplateDTO,
} from '@/features/marketing/templates/types/template.types'

export const templatesApi = {
  list: () => apiClient.get<TemplateDTO[]>('/templates'),
  create: (input: CreateTemplateDTO) => apiClient.post<TemplateDTO>('/templates', input),
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/templates/${id}`)
  },
  listChannelTemplates: (templateId: string) =>
    apiClient.get<ChannelTemplateDTO[]>(`/templates/${templateId}/channel-templates`),

  listChannelTemplatesByConnection: (connectionId: string) =>
    apiClient.get<ChannelTemplateDTO[]>(`/channel-connections/${connectionId}/channel-templates`),
  syncChannelTemplates: (connectionId: string) =>
    apiClient.post<ChannelTemplateDTO[]>(`/channel-connections/${connectionId}/sync-templates`),
}
