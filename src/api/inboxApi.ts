import { apiClient } from '@/api/apiClient'
import type {
  ConversationDTO,
  ConversationDetailDTO,
  ConversationNoteDTO,
  ListConversationsParams,
  MessageDTO,
  SendMessageDTO,
} from '@/features/communication/inbox/types/inbox.types'

interface UpdateConversationDTO {
  status?: ConversationDTO['status']
  assignedToUserId?: string | null
  tags?: string[]
}

function paramsToQuery(params: ListConversationsParams) {
  return {
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
    assignedToUserId: params.assignedToUserId,
    channelType: params.channelType,
    unassigned: params.unassigned,
  }
}

export const inboxApi = {
  listConversations: (params: ListConversationsParams) =>
    apiClient.getPaginated<ConversationDTO>('/conversations', paramsToQuery(params)),
  getConversation: (id: string) => apiClient.get<ConversationDetailDTO>(`/conversations/${id}`),
  updateConversation: (id: string, input: UpdateConversationDTO) =>
    apiClient.patch<ConversationDTO>(`/conversations/${id}`, input),
  linkContact: (id: string, contactId: string) =>
    apiClient.patch<ConversationDTO>(`/conversations/${id}/link-contact`, { contactId }),
  createContactForConversation: (id: string, input: { firstName: string; lastName?: string }) =>
    apiClient.post<ConversationDTO>(`/conversations/${id}/create-contact`, input),
  // First 100 most-recent messages only -- older-message pagination deferred until real
  // conversation volume shows a need for it.
  listMessages: (id: string) =>
    apiClient.getPaginated<MessageDTO>(`/conversations/${id}/messages`, { page: 1, pageSize: 100 }),
  sendMessage: (id: string, input: SendMessageDTO) =>
    apiClient.post<MessageDTO>(`/conversations/${id}/messages`, input),
  listConversationNotes: (id: string) => apiClient.get<ConversationNoteDTO[]>(`/conversations/${id}/notes`),
  createConversationNote: (id: string, body: string) =>
    apiClient.post<ConversationNoteDTO>(`/conversations/${id}/notes`, { body }),
}
