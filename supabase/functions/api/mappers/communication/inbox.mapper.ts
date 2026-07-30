import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type {
  ConversationDTO,
  ConversationEventDTO,
  ConversationNoteDTO,
  MessageAttachmentDTO,
  MessageDTO,
} from '../../dtos/communication/inbox.dtos.ts'
import type {
  ConversationNoteRow,
  ConversationRow,
  MessageAttachmentRow,
  MessageRow,
} from '../../repositories/communication/inbox.repository.ts'

/** The exact tenant_id -> workspaceId translation point (see docs/architecture.md §2). */
export function mapConversationRowToDTO(row: ConversationRow): ConversationDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    channelIdentityId: row.channel_identity_id,
    channelIdentityValue: row.channel_identities?.value ?? '',
    contactId: row.contact_id,
    contact: row.contacts
      ? { id: row.contacts.id, firstName: row.contacts.first_name, lastName: row.contacts.last_name }
      : null,
    channelConnectionId: row.channel_connection_id,
    channelType: row.channel_type as ChannelType,
    providerThreadId: row.provider_thread_id,
    status: row.status as ConversationDTO['status'],
    tags: row.tags,
    assignedToUserId: row.assigned_to_user_id,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    unreadCount: row.unread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapAttachmentRowToDTO(row: MessageAttachmentRow): MessageAttachmentDTO {
  return {
    id: row.id,
    messageId: row.message_id,
    contentType: row.content_type,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    // Populated by the service layer (a short-lived Supabase Storage signed URL, generated at
    // read time, never persisted) -- always undefined straight out of the mapper.
    url: undefined,
  }
}

export function mapMessageRowToDTO(row: MessageRow): MessageDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    conversationId: row.conversation_id,
    channelConnectionId: row.channel_connection_id,
    direction: row.direction as MessageDTO['direction'],
    messageType: row.message_type as MessageDTO['messageType'],
    body: row.body,
    channelTemplateId: row.channel_template_id,
    providerMessageId: row.provider_message_id,
    status: row.status as MessageDTO['status'],
    errorCode: row.error_code,
    errorMessage: row.error_message,
    sentByUserId: row.sent_by_user_id,
    attachments: (row.message_attachments ?? []).map(mapAttachmentRowToDTO),
    metadata: row.metadata,
    createdAt: row.created_at,
    occurredAt: row.occurred_at,
  }
}

export function mapConversationEventRowToDTO(row: {
  id: string
  conversation_id: string
  event_type: string
  actor_user_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}): ConversationEventDTO {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  }
}

export function mapConversationNoteRowToDTO(row: ConversationNoteRow): ConversationNoteDTO {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
