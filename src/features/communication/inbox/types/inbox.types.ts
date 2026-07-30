// Mirrors supabase/functions/api/dtos/communication/inbox.dtos.ts -- keep in sync.
// Schema + service layer are implemented (see docs/modules/communication/inbox.md); blocked on a
// concrete IChannelProvider before there's anything real to display. No API client/hooks/pages yet.
import type { ChannelType } from '@/lib/channelTypes'
import type { ContactDTO } from '@/features/crm/contacts/types/contact.types'
import type { NoteDTO } from '@/features/crm/notes/types/note.types'
import type { TaskDTO } from '@/features/crm/tasks/types/task.types'

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
  width: number | null
  height: number | null
  durationSeconds: number | null
  /** A short-lived Supabase Storage signed URL, generated server-side at read time. */
  url?: string
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

/** Composes CRM context rather than owning a denormalized copy -- "Communication depends on CRM"
 * (docs/modules/communication/inbox.md). `contact` is null for unassigned conversations. */
export interface ConversationDetailDTO {
  conversation: ConversationDTO
  contact: ContactDTO | null
  notes: NoteDTO[]
  openTasks: TaskDTO[]
  conversationNotes: ConversationNoteDTO[]
}

export interface ListConversationsParams {
  page?: number
  pageSize?: number
  status?: 'open' | 'pending' | 'closed'
  assignedToUserId?: string
  channelType?: ChannelType
  unassigned?: boolean
}

export interface SendMessageDTO {
  text?: string
  // Ordered/positional, not name-keyed -- matches WhatsApp's {{1}}, {{2}} placeholder convention.
  template?: { name: string; languageCode: string; variables?: string[] }
  // Collection-shaped even though WhatsApp only allows one today -- see the backend schema comment.
  attachments?: UploadedAttachmentDTO[]
}

/** Returned by `POST /conversations/:id/attachments` -- feeds directly into `SendMessageDTO.attachments`. */
export interface UploadedAttachmentDTO {
  storagePath: string
  providerMediaId: string
  contentType: string
  filename: string | null
  fileSizeBytes: number
}
