import { apiClient } from '@/api/apiClient'
import type {
  ContactChannelDTO,
  ContactDTO,
  CreateContactChannelDTO,
  CreateContactDTO,
  LeadSourceDTO,
  LeadStatusDTO,
  ListContactsParams,
  UpdateContactDTO,
} from '@/features/crm/contacts/types/contact.types'

function paramsToQuery(params: ListContactsParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    leadStatusId: params.leadStatusId,
    leadSourceId: params.leadSourceId,
    assignedToUserId: params.assignedToUserId,
  }
}

export const contactsApi = {
  list: (params: ListContactsParams) =>
    apiClient.getPaginated<ContactDTO>('/contacts', paramsToQuery(params)),
  getById: (id: string) => apiClient.get<ContactDTO>(`/contacts/${id}`),
  create: (input: CreateContactDTO) => apiClient.post<ContactDTO>('/contacts', input),
  update: (id: string, input: UpdateContactDTO) => apiClient.patch<ContactDTO>(`/contacts/${id}`, input),
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`)
  },

  addChannel: (contactId: string, input: CreateContactChannelDTO) =>
    apiClient.post<ContactChannelDTO>(`/contacts/${contactId}/channels`, input),
  updateChannel: (channelId: string, input: { value?: string; isPrimary?: boolean }) =>
    apiClient.patch<ContactChannelDTO>(`/contact-channels/${channelId}`, input),
  removeChannel: async (channelId: string): Promise<void> => {
    await apiClient.delete(`/contact-channels/${channelId}`)
  },

  listLeadStatuses: () => apiClient.get<LeadStatusDTO[]>('/lead-statuses'),
  listLeadSources: () => apiClient.get<LeadSourceDTO[]>('/lead-sources'),
}
