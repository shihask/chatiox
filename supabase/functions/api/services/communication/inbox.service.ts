import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { recordAudit } from '../../../_shared/audit.ts'
import { emit } from '../../../_shared/events.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import { ConflictError, NotFoundError } from '../../../_shared/errors.ts'
import type { Page } from '../../../_shared/repository.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { NormalizedInboundEvent } from '../../channels/channel.types.ts'
import { getProvider } from '../../channels/providerRegistry.ts'
import * as inboxRepository from '../../repositories/communication/inbox.repository.ts'
import * as channelsRepository from '../../repositories/communication/channels.repository.ts'
import * as contactsRepository from '../../repositories/crm/contacts.repository.ts'
import * as notesRepository from '../../repositories/crm/notes.repository.ts'
import * as tasksRepository from '../../repositories/crm/tasks.repository.ts'
import { mapContactRowToDTO } from '../../mappers/crm/contacts.mapper.ts'
import { mapNoteRowToDTO } from '../../mappers/crm/notes.mapper.ts'
import { mapTaskRowToDTO } from '../../mappers/crm/tasks.mapper.ts'
import {
  mapConversationNoteRowToDTO,
  mapConversationRowToDTO,
  mapMessageRowToDTO,
} from '../../mappers/communication/inbox.mapper.ts'
import type {
  CreateContactForConversationInput,
  CreateConversationNoteInput,
  LinkContactInput,
  ListConversationsQuery,
  SendMessageInput,
  UpdateConversationInput,
} from '../../schemas/communication/inbox.schemas.ts'
import type {
  ConversationDetailDTO,
  ConversationDTO,
  ConversationNoteDTO,
  MessageDTO,
} from '../../dtos/communication/inbox.dtos.ts'

const WRITE_ROLES = ['owner', 'admin', 'manager', 'agent'] as const

export async function listConversations(
  ctx: WorkspaceRequestContext,
  query: ListConversationsQuery,
): Promise<Page<ConversationDTO>> {
  const page = await inboxRepository.list(ctx.supabase, ctx.workspaceId, query)
  return { ...page, items: page.items.map(mapConversationRowToDTO) }
}

export async function getConversationDetail(
  ctx: WorkspaceRequestContext,
  id: string,
): Promise<ConversationDetailDTO> {
  const row = await inboxRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, id)
  const conversation = mapConversationRowToDTO(row)

  let contact: ConversationDetailDTO['contact'] = null
  let notes: ConversationDetailDTO['notes'] = []
  let openTasks: ConversationDetailDTO['openTasks'] = []

  if (row.contact_id) {
    const contactRow = await contactsRepository.getById(ctx.supabase, ctx.workspaceId, row.contact_id)
    if (contactRow) contact = mapContactRowToDTO(contactRow)

    const noteRows = await notesRepository.listByContact(ctx.supabase, ctx.workspaceId, row.contact_id)
    notes = noteRows.map(mapNoteRowToDTO)

    const taskRows = await tasksRepository.listByContact(ctx.supabase, ctx.workspaceId, row.contact_id)
    openTasks = taskRows.filter((t) => t.status === 'open').map(mapTaskRowToDTO)
  }

  const conversationNoteRows = await inboxRepository.listConversationNotes(ctx.supabase, ctx.workspaceId, id)

  return {
    conversation,
    contact,
    notes,
    openTasks,
    conversationNotes: conversationNoteRows.map(mapConversationNoteRowToDTO),
  }
}

export async function updateConversation(
  ctx: WorkspaceRequestContext,
  id: string,
  input: UpdateConversationInput,
): Promise<ConversationDTO> {
  requireRole(ctx, [...WRITE_ROLES])
  const existing = await inboxRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, id)
  const row = await inboxRepository.updateConversation(ctx.supabase, ctx.workspaceId, id, input)
  const occurredAt = new Date().toISOString()

  if (input.assignedToUserId !== undefined && input.assignedToUserId !== existing.assigned_to_user_id) {
    await inboxRepository.insertConversationEvent(ctx.supabase, ctx.workspaceId, id, 'assigned', ctx.userId, {
      fromUserId: existing.assigned_to_user_id,
      toUserId: input.assignedToUserId,
    })
    if (input.assignedToUserId) {
      emit({
        type: 'ConversationAssigned',
        workspaceId: ctx.workspaceId,
        conversationId: id,
        assignedToUserId: input.assignedToUserId,
        actorUserId: ctx.userId,
        occurredAt,
      })
    }
  }

  if (input.status !== undefined && input.status !== existing.status) {
    await inboxRepository.insertConversationEvent(ctx.supabase, ctx.workspaceId, id, 'status_changed', ctx.userId, {
      fromStatus: existing.status,
      toStatus: input.status,
    })
  }

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'conversation.updated',
    targetType: 'conversation',
    targetId: id,
    metadata: { changedFields: Object.keys(input) },
  })

  return mapConversationRowToDTO(row)
}

export async function linkContact(
  ctx: WorkspaceRequestContext,
  id: string,
  input: LinkContactInput,
): Promise<ConversationDTO> {
  requireRole(ctx, [...WRITE_ROLES])
  const row = await inboxRepository.linkContact(ctx.supabase, ctx.workspaceId, id, input.contactId)
  const occurredAt = new Date().toISOString()

  await inboxRepository.insertConversationEvent(ctx.supabase, ctx.workspaceId, id, 'contact_linked', ctx.userId, {
    contactId: input.contactId,
  })
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'conversation.contact_linked',
    targetType: 'conversation',
    targetId: id,
    metadata: { contactId: input.contactId },
  })
  emit({
    type: 'ConversationContactLinked',
    workspaceId: ctx.workspaceId,
    conversationId: id,
    contactId: input.contactId,
    actorUserId: ctx.userId,
    occurredAt,
  })

  return mapConversationRowToDTO(row)
}

export async function createContactForConversation(
  ctx: WorkspaceRequestContext,
  id: string,
  input: CreateContactForConversationInput,
): Promise<ConversationDTO> {
  requireRole(ctx, [...WRITE_ROLES])
  const existing = await inboxRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, id)
  if (existing.contact_id) throw new ConflictError('This conversation is already linked to a contact')
  const identityValue = existing.channel_identities?.value
  if (!identityValue) throw new NotFoundError('Conversation identity not found')

  const contactRow = await contactsRepository.create(ctx.supabase, ctx.workspaceId, {
    firstName: input.firstName,
    lastName: input.lastName,
    channels: [{ channelType: existing.channel_type as ChannelType, value: identityValue, isPrimary: true }],
  })

  const row = await inboxRepository.linkContact(ctx.supabase, ctx.workspaceId, id, contactRow.id)
  const occurredAt = new Date().toISOString()

  await inboxRepository.insertConversationEvent(ctx.supabase, ctx.workspaceId, id, 'contact_created', ctx.userId, {
    contactId: contactRow.id,
  })
  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'conversation.contact_created',
    targetType: 'conversation',
    targetId: id,
    metadata: { contactId: contactRow.id },
  })
  emit({
    type: 'ConversationContactLinked',
    workspaceId: ctx.workspaceId,
    conversationId: id,
    contactId: contactRow.id,
    actorUserId: ctx.userId,
    occurredAt,
  })

  return mapConversationRowToDTO(row)
}

export async function listMessages(
  ctx: WorkspaceRequestContext,
  conversationId: string,
  params: { page: number; pageSize: number },
): Promise<Page<MessageDTO>> {
  const page = await inboxRepository.listMessages(ctx.supabase, ctx.workspaceId, conversationId, params)
  return { ...page, items: page.items.map(mapMessageRowToDTO) }
}

export async function sendMessage(
  ctx: WorkspaceRequestContext,
  conversationId: string,
  input: SendMessageInput,
): Promise<MessageDTO> {
  requireRole(ctx, [...WRITE_ROLES])
  const conversation = await inboxRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, conversationId)
  const channelType = conversation.channel_type as ChannelType

  // Must resolve THIS conversation's own connection, not "any connected connection of this
  // channel type" -- a workspace can have multiple connected numbers for the same channel type
  // (e.g. Sales WhatsApp + Support WhatsApp), and picking the wrong one would silently send from
  // the wrong number (or, with more than one match, crash outright on an ambiguous .maybeSingle()).
  const connectionRow = await channelsRepository.getByIdOrThrow(
    ctx.supabase,
    ctx.workspaceId,
    conversation.channel_connection_id,
  )
  if (connectionRow.status !== 'connected') {
    throw new ConflictError(`${channelType} isn't connected for this workspace yet`)
  }

  const resolvedConnection = await channelsRepository.resolveForSending(connectionRow.id)
  if (!resolvedConnection) throw new ConflictError(`${channelType} isn't connected for this workspace yet`)

  const toAddress = conversation.channel_identities?.value
  if (!toAddress) throw new NotFoundError('Conversation identity not found')

  const provider = getProvider(channelType)
  const result = await provider.send(
    {
      tenantId: ctx.workspaceId,
      channelType,
      to: toAddress,
      text: input.text,
      template: input.template,
    },
    resolvedConnection,
  )

  const row = await inboxRepository.insertMessage(ctx.supabase, ctx.workspaceId, {
    conversationId,
    channelConnectionId: connectionRow.id,
    direction: 'outbound',
    messageType: input.template ? 'template' : 'text',
    body: input.text ?? null,
    providerMessageId: result.providerMessageId,
    status: result.status,
    errorCode: result.error?.code ?? null,
    errorMessage: result.error?.message ?? null,
    sentByUserId: ctx.userId,
  })

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'message.sent',
    targetType: 'message',
    targetId: row.id,
    metadata: { conversationId },
  })
  emit({
    type: 'MessageSent',
    workspaceId: ctx.workspaceId,
    conversationId,
    messageId: row.id,
    actorUserId: ctx.userId,
    occurredAt: new Date().toISOString(),
  })

  return mapMessageRowToDTO(row)
}

export async function listConversationNotes(
  ctx: WorkspaceRequestContext,
  conversationId: string,
): Promise<ConversationNoteDTO[]> {
  const rows = await inboxRepository.listConversationNotes(ctx.supabase, ctx.workspaceId, conversationId)
  return rows.map(mapConversationNoteRowToDTO)
}

export async function createConversationNote(
  ctx: WorkspaceRequestContext,
  conversationId: string,
  input: CreateConversationNoteInput,
): Promise<ConversationNoteDTO> {
  requireRole(ctx, [...WRITE_ROLES])
  const row = await inboxRepository.createConversationNote(ctx.supabase, ctx.workspaceId, conversationId, input.body, ctx.userId)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'conversation_note.created',
    targetType: 'conversation_note',
    targetId: row.id,
    metadata: { conversationId },
  })

  return mapConversationNoteRowToDTO(row)
}

// ---------------------------------------------------------------------------
// Inbound ingest -- called from communication/webhooks.controller.ts with a service-role client,
// no WorkspaceRequestContext (there's no authenticated user for a provider webhook).
// ---------------------------------------------------------------------------

async function downloadAndStoreAttachment(
  serviceRoleClient: SupabaseClient,
  tenantId: string,
  messageId: string,
  attachment: { contentType: string; url: string },
): Promise<string> {
  const response = await fetch(attachment.url)
  if (!response.ok) throw new Error(`Failed to download attachment: ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const extension = attachment.contentType.split('/')[1] ?? 'bin'
  const storagePath = `${tenantId}/${messageId}/${crypto.randomUUID()}.${extension}`

  const { error } = await serviceRoleClient.storage
    .from('message-attachments')
    .upload(storagePath, bytes, { contentType: attachment.contentType })
  if (error) throw new Error(`Failed to upload attachment: ${error.message}`)

  return storagePath
}

export async function ingestInboundEvent(
  serviceRoleClient: SupabaseClient,
  connection: { id: string; tenantId: string; channelType: ChannelType },
  event: NormalizedInboundEvent,
): Promise<void> {
  if (event.type === 'message') {
    // No Contact created automatically for an unknown sender -- an "Unassigned" inbox is a
    // first-class state (see docs/modules/communication/inbox.md).
    const identity = await inboxRepository.findOrCreateChannelIdentity(
      serviceRoleClient,
      connection.tenantId,
      connection.channelType,
      event.from,
    )

    let conversation = await inboxRepository.findLiveConversationForIdentity(
      serviceRoleClient,
      connection.tenantId,
      identity.id,
    )
    let isNewConversation = false
    if (!conversation) {
      conversation = await inboxRepository.createConversation(serviceRoleClient, connection.tenantId, {
        channelIdentityId: identity.id,
        contactId: identity.contact_id,
        channelConnectionId: connection.id,
        channelType: connection.channelType,
      })
      isNewConversation = true
    }

    const { message, isNew } = await inboxRepository.insertInboundMessageIdempotent(
      serviceRoleClient,
      connection.tenantId,
      {
        conversationId: conversation.id,
        channelConnectionId: connection.id,
        direction: 'inbound',
        messageType: event.text ? 'text' : 'media',
        body: event.text ?? null,
        providerMessageId: event.providerMessageId ?? event.providerEventId,
        status: 'received',
        occurredAt: event.occurredAt,
      },
    )

    if (isNew && event.attachments) {
      for (const attachment of event.attachments) {
        try {
          const storagePath = await downloadAndStoreAttachment(serviceRoleClient, connection.tenantId, message.id, attachment)
          await inboxRepository.insertAttachment(serviceRoleClient, connection.tenantId, message.id, {
            contentType: attachment.contentType,
            storagePath,
          })
        } catch (err) {
          console.error('[inbox] failed to download/store attachment', err)
        }
      }
    }

    if (!isNew) return // duplicate webhook delivery -- already processed, ack and stop

    if (isNewConversation) {
      emit({
        type: 'ConversationCreated',
        workspaceId: connection.tenantId,
        conversationId: conversation.id,
        channelType: connection.channelType,
        occurredAt: event.occurredAt,
      })
    }
    emit({
      type: 'MessageReceived',
      workspaceId: connection.tenantId,
      conversationId: conversation.id,
      messageId: message.id,
      occurredAt: event.occurredAt,
    })
    return
  }

  if (event.type === 'status_update') {
    if (!event.providerMessageId || !event.status) return
    const message = await inboxRepository.findMessageByProviderMessageId(
      serviceRoleClient,
      connection.id,
      event.providerMessageId,
    )
    if (!message) return

    const changed = await inboxRepository.advanceMessageStatus(serviceRoleClient, message.id, message.status, event.status)
    if (!changed) return // duplicate/out-of-order status webhook -- no-op

    await inboxRepository.insertMessageStatusEvent(
      serviceRoleClient,
      connection.tenantId,
      message.id,
      event.status,
      event.errorCode ?? null,
      event.errorMessage ?? null,
      event.occurredAt,
      null,
    )

    if (event.status === 'failed') {
      emit({
        type: 'MessageFailed',
        workspaceId: connection.tenantId,
        conversationId: message.conversation_id,
        messageId: message.id,
        errorCode: event.errorCode ?? 'unknown',
        occurredAt: event.occurredAt,
      })
    } else if (event.status === 'delivered') {
      emit({
        type: 'MessageDelivered',
        workspaceId: connection.tenantId,
        conversationId: message.conversation_id,
        messageId: message.id,
        occurredAt: event.occurredAt,
      })
    } else if (event.status === 'read') {
      emit({
        type: 'MessageRead',
        workspaceId: connection.tenantId,
        conversationId: message.conversation_id,
        messageId: message.id,
        occurredAt: event.occurredAt,
      })
    }
  }
}
