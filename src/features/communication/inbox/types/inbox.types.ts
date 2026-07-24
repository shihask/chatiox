// Mirrors docs/modules/communication/inbox.md -- not implemented yet, no backend route exists.
// ChannelType intentionally duplicated here (not imported from src/lib/channelTypes.ts) since this
// module has no real code depending on it yet -- reconcile once Inbox is actually implemented.
type ChannelType = 'whatsapp' | 'email' | 'sms' | 'telegram' | 'instagram' | 'messenger' | 'rcs'

export interface ConversationDTO {
  id: string
  workspaceId: string
  contactId: string
  channelType: ChannelType
  status: 'open' | 'pending' | 'closed'
  assignedToUserId: string | null
  lastMessageAt: string | null
}

export interface AttachmentDTO {
  id: string
  messageId: string
  mediaUrl: string
  mimeType: string
  fileName: string | null
}

export interface InboxMessageDTO {
  id: string
  conversationId: string
  direction: 'inbound' | 'outbound'
  body: string | null
  attachments: AttachmentDTO[]
  sentByUserId: string | null
  providerMessageId: string | null
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  createdAt: string
}

export interface ConversationEventDTO {
  id: string
  conversationId: string
  type: 'assigned' | 'status_changed' | 'note_added' | 'reopened'
  actorUserId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface ConversationDetailDTO {
  conversation: ConversationDTO
  // contact/notes/openTasks/timeline added once crm/contacts is reconciled with this stub and
  // crm/notes, crm/tasks, crm/timeline exist
}
