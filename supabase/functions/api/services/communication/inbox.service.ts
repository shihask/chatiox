import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { recordAudit } from '../../../_shared/audit.ts'
import { emit } from '../../../_shared/events.ts'
import { requireRole } from '../../../_shared/rbac.ts'
import { BadRequestError, ConflictError, NotFoundError } from '../../../_shared/errors.ts'
import { validateAttachment } from '../../../_shared/validateAttachment.ts'
import type { Page } from '../../../_shared/repository.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { NormalizedInboundEvent } from '../../channels/channel.types.ts'
import { getProvider } from '../../channels/providerRegistry.ts'
import * as inboxRepository from '../../repositories/communication/inbox.repository.ts'
import * as channelsRepository from '../../repositories/communication/channels.repository.ts'
import * as templatesRepository from '../../repositories/communication/templates.repository.ts'
import * as contactsRepository from '../../repositories/crm/contacts.repository.ts'
import * as notesRepository from '../../repositories/crm/notes.repository.ts'
import * as tasksRepository from '../../repositories/crm/tasks.repository.ts'
import { mapContactRowToDTO } from '../../mappers/crm/contacts.mapper.ts'
import { mapNoteRowToDTO } from '../../mappers/crm/notes.mapper.ts'
import { mapTaskRowToDTO } from '../../mappers/crm/tasks.mapper.ts'
import {
  mapAttachmentRowToDTO,
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
  StartConversationInput,
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

/** Business-initiated counterpart to ingestInboundEvent's find-or-create -- lets an agent start
 * messaging a Contact who has never written in, rather than tying conversation creation
 * exclusively to inbound webhooks. Both directions converge on the same channel_identities +
 * conversations rows, so a reply from the contact afterward just finds this conversation rather
 * than fragmenting into a second one. */
export async function getOrCreateConversationForContact(
  ctx: WorkspaceRequestContext,
  input: StartConversationInput,
): Promise<ConversationDTO> {
  requireRole(ctx, [...WRITE_ROLES])

  const contactRow = await contactsRepository.getById(ctx.supabase, ctx.workspaceId, input.contactId)
  if (!contactRow) throw new NotFoundError('Contact not found')
  const contact = mapContactRowToDTO(contactRow)
  const channel = contact.channels.find((c) => c.channelType === input.channelType)
  if (!channel) throw new BadRequestError(`This contact has no ${input.channelType} channel`)

  const connections = await channelsRepository.listConnectedForChannelType(ctx.supabase, ctx.workspaceId, input.channelType)
  if (connections.length === 0) throw new ConflictError(`${input.channelType} isn't connected for this workspace yet`)
  if (connections.length > 1) {
    throw new ConflictError(
      `Multiple connected ${input.channelType} channels exist -- choosing which one to send from isn't supported yet`,
    )
  }
  const connection = connections[0]

  const identity = await inboxRepository.findOrCreateChannelIdentityForContact(
    ctx.supabase,
    ctx.workspaceId,
    input.channelType,
    channel.value,
    input.contactId,
  )

  const existingConversation = await inboxRepository.findLiveConversationForIdentity(ctx.supabase, ctx.workspaceId, identity.id)
  if (existingConversation) return mapConversationRowToDTO(existingConversation)

  const conversation = await inboxRepository.createConversation(ctx.supabase, ctx.workspaceId, {
    channelIdentityId: identity.id,
    contactId: input.contactId,
    channelConnectionId: connection.id,
    channelType: input.channelType,
  })

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'conversation.started',
    targetType: 'conversation',
    targetId: conversation.id,
    metadata: { contactId: input.contactId, channelType: input.channelType },
  })
  emit({
    type: 'ConversationCreated',
    workspaceId: ctx.workspaceId,
    conversationId: conversation.id,
    channelType: input.channelType,
    occurredAt: new Date().toISOString(),
  })

  return mapConversationRowToDTO(conversation)
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

/** The message-attachments bucket is private -- this is the only way the frontend can ever display
 * one. Generated at read time, never persisted (a stale/expired URL is simply regenerated on the
 * next fetch, no background refresh job needed). */
const ATTACHMENT_URL_TTL_SECONDS = 60 * 60

async function enrichAttachmentUrls(supabase: SupabaseClient, messages: MessageDTO[]): Promise<MessageDTO[]> {
  const allAttachments = messages.flatMap((m) => m.attachments)
  if (allAttachments.length === 0) return messages

  await Promise.all(
    allAttachments.map(async (attachment) => {
      const { data } = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(attachment.storagePath, ATTACHMENT_URL_TTL_SECONDS)
      attachment.url = data?.signedUrl
    }),
  )
  return messages
}

export async function listMessages(
  ctx: WorkspaceRequestContext,
  conversationId: string,
  params: { page: number; pageSize: number },
): Promise<Page<MessageDTO>> {
  const page = await inboxRepository.listMessages(ctx.supabase, ctx.workspaceId, conversationId, params)
  const items = await enrichAttachmentUrls(ctx.supabase, page.items.map(mapMessageRowToDTO))
  return { ...page, items }
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

  // A template must be a real, approved, synced-for-this-connection row before anything reaches
  // Meta -- never let an unapproved/unknown template name through on trust alone.
  let renderedBody = input.text ?? null
  let channelTemplateId: string | null = null
  if (input.template) {
    const channelTemplate = await templatesRepository.findChannelTemplateByName(
      ctx.supabase,
      ctx.workspaceId,
      connectionRow.id,
      input.template.name,
      input.template.languageCode,
    )
    if (!channelTemplate) throw new NotFoundError(`Template "${input.template.name}" (${input.template.languageCode}) not found for this connection`)
    if (channelTemplate.status !== 'approved') {
      throw new ConflictError(`Template "${input.template.name}" is not approved yet (status: ${channelTemplate.status})`)
    }

    const validation = await provider.validateTemplate({
      name: input.template.name,
      languageCode: input.template.languageCode,
      bodyVariables: channelTemplate.variables as string[],
    })
    if (!validation.valid) {
      throw new BadRequestError(validation.errors?.join('; ') ?? 'Template variables are invalid')
    }

    renderedBody =
      channelTemplate.body && input.template.variables
        ? input.template.variables.reduce<string>(
            (body, value, index) => body.replaceAll(`{{${index + 1}}}`, value),
            channelTemplate.body,
          )
        : (channelTemplate.body ?? renderedBody)
    channelTemplateId = channelTemplate.id
  }

  // An attachment must already be uploaded (POST /conversations/:id/attachments) before it can be
  // referenced here -- the provider never receives raw bytes from sendMessage, only a mediaId it
  // already has from the upload step.
  const attachment = input.attachments?.[0]

  const result = await provider.send(
    {
      tenantId: ctx.workspaceId,
      channelType,
      to: toAddress,
      text: input.text,
      template: input.template,
      attachments: attachment
        ? [{ contentType: attachment.contentType, source: { kind: 'mediaId', mediaId: attachment.providerMediaId }, filename: attachment.filename }]
        : undefined,
    },
    resolvedConnection,
  )

  const row = await inboxRepository.insertMessage(ctx.supabase, ctx.workspaceId, {
    conversationId,
    channelConnectionId: connectionRow.id,
    direction: 'outbound',
    messageType: input.template ? 'template' : attachment ? 'media' : 'text',
    body: renderedBody,
    channelTemplateId,
    providerMessageId: result.providerMessageId,
    status: result.status,
    errorCode: result.error?.code ?? null,
    errorMessage: result.error?.message ?? null,
    sentByUserId: ctx.userId,
  })

  let insertedAttachment: Awaited<ReturnType<typeof inboxRepository.insertAttachment>> | null = null
  if (attachment) {
    // Storage already has the bytes from the upload step -- no re-download, just record the
    // reference against the now-real message id.
    insertedAttachment = await inboxRepository.insertAttachment(ctx.supabase, ctx.workspaceId, row.id, {
      contentType: attachment.contentType,
      storagePath: attachment.storagePath,
      fileName: attachment.filename,
      fileSizeBytes: attachment.fileSizeBytes,
      providerMediaId: attachment.providerMediaId,
    })
  }

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

  const messageDTO = mapMessageRowToDTO(row)
  if (insertedAttachment) messageDTO.attachments = [mapAttachmentRowToDTO(insertedAttachment)]
  const [enriched] = await enrichAttachmentUrls(ctx.supabase, [messageDTO])
  return enriched
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

export interface UploadAttachmentResult {
  storagePath: string
  providerMediaId: string
  contentType: string
  fileSizeBytes: number
  filename: string | null
}

/** Step 1 of sending media: uploads to the provider (Meta, for WhatsApp -- it only ever sends
 * media it already hosts, never an arbitrary external URL) AND to Chatiox's own private Storage
 * bucket in the same request, so Chatiox never has to re-fetch from the provider later. The
 * result feeds directly into sendMessage's `attachments` input -- this never creates a message
 * itself, matching "media is still just another message through the one send pipeline". */
export async function uploadAttachment(
  ctx: WorkspaceRequestContext,
  conversationId: string,
  file: { contentType: string; data: Uint8Array; filename?: string },
): Promise<UploadAttachmentResult> {
  requireRole(ctx, [...WRITE_ROLES])
  validateAttachment({ contentType: file.contentType, sizeBytes: file.data.byteLength, filename: file.filename })

  const conversation = await inboxRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, conversationId)
  const channelType = conversation.channel_type as ChannelType
  const connectionRow = await channelsRepository.getByIdOrThrow(ctx.supabase, ctx.workspaceId, conversation.channel_connection_id)
  if (connectionRow.status !== 'connected') {
    throw new ConflictError(`${channelType} isn't connected for this workspace yet`)
  }
  const resolvedConnection = await channelsRepository.resolveForSending(connectionRow.id)
  if (!resolvedConnection) throw new ConflictError(`${channelType} isn't connected for this workspace yet`)

  const provider = getProvider(channelType)
  const { mediaId } = await provider.uploadMedia(
    { tenantId: ctx.workspaceId, contentType: file.contentType, data: file.data, filename: file.filename },
    resolvedConnection,
  )

  const extension = file.contentType.split('/')[1] ?? 'bin'
  const storagePath = `${ctx.workspaceId}/uploads/${crypto.randomUUID()}.${extension}`
  const { error } = await ctx.supabase.storage
    .from('message-attachments')
    .upload(storagePath, file.data, { contentType: file.contentType })
  if (error) throw new Error(`Failed to store attachment: ${error.message}`)

  return {
    storagePath,
    providerMediaId: mediaId,
    contentType: file.contentType,
    fileSizeBytes: file.data.byteLength,
    filename: file.filename ?? null,
  }
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
  headers?: Record<string, string>,
): Promise<string> {
  const response = await fetch(attachment.url, { headers })
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

    if (isNew && event.attachments && event.attachments.length > 0) {
      // Only resolved when actually needed -- avoids an extra Vault round-trip for the common
      // text-only-message case.
      const provider = getProvider(connection.channelType)
      const resolvedConnection = provider.resolveMediaForDownload
        ? await channelsRepository.resolveForSending(connection.id)
        : null

      for (const attachment of event.attachments) {
        try {
          if (!provider.resolveMediaForDownload || !resolvedConnection) {
            throw new Error(`${connection.channelType} provider cannot resolve media for download`)
          }
          const { url, headers } = await provider.resolveMediaForDownload(attachment.mediaId, resolvedConnection)
          const storagePath = await downloadAndStoreAttachment(
            serviceRoleClient,
            connection.tenantId,
            message.id,
            { contentType: attachment.contentType, url },
            headers,
          )
          await inboxRepository.insertAttachment(serviceRoleClient, connection.tenantId, message.id, {
            contentType: attachment.contentType,
            storagePath,
            fileName: attachment.filename,
            providerMediaId: attachment.mediaId,
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
