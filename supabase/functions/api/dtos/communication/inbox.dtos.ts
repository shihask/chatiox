import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { ContactDTO } from '../../dtos/crm/contacts.dtos.ts'
import type { NoteDTO } from '../../dtos/crm/notes.dtos.ts'
import type { TaskDTO } from '../../dtos/crm/tasks.dtos.ts'

export interface ConversationContactSummaryDTO {
  id: string
  firstName: string
  lastName: string | null
}

export interface ConversationDTO {
  id: string
  workspaceId: string
  channelIdentityId: string
  channelIdentityValue: string
  contactId: string | null
  contact: ConversationContactSummaryDTO | null
  channelConnectionId: string
  channelType: ChannelType
  providerThreadId: string | null
  status: 'open' | 'pending' | 'closed'
  tags: string[]
  assignedToUserId: string | null
  lastMessageAt: string | null
  lastMessagePreview: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface MessageAttachmentDTO {
  id: string
  messageId: string
  contentType: string
  storagePath: string
  fileName: string | null
  fileSizeBytes: number | null
}

export interface MessageDTO {
  id: string
  workspaceId: string
  conversationId: string
  channelConnectionId: string
  direction: 'inbound' | 'outbound'
  messageType: 'text' | 'template' | 'media' | 'interactive' | 'system'
  body: string | null
  channelTemplateId: string | null
  providerMessageId: string | null
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'
  errorCode: string | null
  errorMessage: string | null
  sentByUserId: string | null
  attachments: MessageAttachmentDTO[]
  metadata: Record<string, unknown>
  createdAt: string
  occurredAt: string
}

export interface ConversationEventDTO {
  id: string
  conversationId: string
  eventType: string
  actorUserId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface ConversationNoteDTO {
  id: string
  conversationId: string
  body: string
  createdBy: string | null
  createdAt: string
}

/** Composes CRM context rather than owning a denormalized copy of it -- see docs/modules/
 * communication/inbox.md's "Communication depends on CRM" principle. `contact` is null for
 * unassigned conversations. */
export interface ConversationDetailDTO {
  conversation: ConversationDTO
  contact: ContactDTO | null
  notes: NoteDTO[]
  openTasks: TaskDTO[]
  conversationNotes: ConversationNoteDTO[]
}
