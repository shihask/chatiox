import type { ListConversationsParams } from '@/features/communication/inbox/types/inbox.types'

export const conversationsKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationsKeys.all, 'list'] as const,
  list: (params: ListConversationsParams) => [...conversationsKeys.lists(), params] as const,
  details: () => [...conversationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationsKeys.details(), id] as const,
}

export const messagesKeys = {
  all: ['messages'] as const,
  list: (conversationId: string) => [...messagesKeys.all, conversationId] as const,
}

export const conversationNotesKeys = {
  all: ['conversation-notes'] as const,
  list: (conversationId: string) => [...conversationNotesKeys.all, conversationId] as const,
}
