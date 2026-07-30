import { parseBody, parseQuery } from '../../../_shared/validate.ts'
import { jsonCreated, jsonOk, jsonPaginated } from '../../../_shared/response.ts'
import { buildPaginationMeta } from '../../../_shared/pagination.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as inboxService from '../../services/communication/inbox.service.ts'
import {
  createContactForConversationSchema,
  createConversationNoteSchema,
  linkContactSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  sendMessageSchema,
  startConversationSchema,
  updateConversationSchema,
} from '../../schemas/communication/inbox.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const listConversations: WorkspaceHandler = async (req, { ctx }) => {
  const query = parseQuery(listConversationsQuerySchema, new URL(req.url))
  const page = await inboxService.listConversations(ctx, query)
  return jsonPaginated(page.items, buildPaginationMeta(page.page, page.pageSize, page.total))
}

export const startConversation: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(startConversationSchema, req)
  const conversation = await inboxService.getOrCreateConversationForContact(ctx, input)
  return jsonCreated(conversation)
}

export const getConversation: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const detail = await inboxService.getConversationDetail(ctx, id)
  return jsonOk(detail)
}

export const updateConversation: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(updateConversationSchema, req)
  const conversation = await inboxService.updateConversation(ctx, id, input)
  return jsonOk(conversation)
}

export const linkContact: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(linkContactSchema, req)
  const conversation = await inboxService.linkContact(ctx, id, input)
  return jsonOk(conversation)
}

export const createContact: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(createContactForConversationSchema, req)
  const conversation = await inboxService.createContactForConversation(ctx, id, input)
  return jsonCreated(conversation)
}

export const listMessages: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const query = parseQuery(listMessagesQuerySchema, new URL(req.url))
  const page = await inboxService.listMessages(ctx, id, query)
  return jsonPaginated(page.items, buildPaginationMeta(page.page, page.pageSize, page.total))
}

export const sendMessage: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(sendMessageSchema, req)
  const message = await inboxService.sendMessage(ctx, id, input)
  return jsonCreated(message)
}

export const uploadAttachment: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) throw new BadRequestError('No file provided')

  const data = new Uint8Array(await file.arrayBuffer())
  const result = await inboxService.uploadAttachment(ctx, id, {
    contentType: file.type || 'application/octet-stream',
    data,
    filename: file.name || undefined,
  })
  return jsonCreated(result)
}

export const listConversationNotes: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const notes = await inboxService.listConversationNotes(ctx, id)
  return jsonOk(notes)
}

export const createConversationNote: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(createConversationNoteSchema, req)
  const note = await inboxService.createConversationNote(ctx, id, input)
  return jsonCreated(note)
}
