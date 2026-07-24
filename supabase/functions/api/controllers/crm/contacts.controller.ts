import { parseBody, parseQuery } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk, jsonPaginated } from '../../../_shared/response.ts'
import { buildPaginationMeta } from '../../../_shared/pagination.ts'
import { BadRequestError, NotFoundError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as contactsService from '../../services/crm/contacts.service.ts'
import {
  addContactChannelSchema,
  createContactSchema,
  listContactsQuerySchema,
  updateContactChannelSchema,
  updateContactSchema,
} from '../../schemas/crm/contacts.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const list: WorkspaceHandler = async (req, { ctx }) => {
  const query = parseQuery(listContactsQuerySchema, new URL(req.url))
  const page = await contactsService.listContacts(ctx, query)
  return jsonPaginated(page.items, buildPaginationMeta(page.page, page.pageSize, page.total))
}

export const create: WorkspaceHandler = async (req, { ctx }) => {
  const input = await parseBody(createContactSchema, req)
  const contact = await contactsService.createContact(ctx, input)
  return jsonCreated(contact)
}

export const getById: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const contact = await contactsService.getContact(ctx, id)
  if (!contact) throw new NotFoundError('Contact not found')
  return jsonOk(contact)
}

export const update: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  const input = await parseBody(updateContactSchema, req)
  const contact = await contactsService.updateContact(ctx, id, input)
  return jsonOk(contact)
}

export const remove: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await contactsService.deleteContact(ctx, id)
  return jsonNoContent()
}

export const addChannel: WorkspaceHandler = async (req, { ctx, params }) => {
  const contactId = requireParam(params, 'id')
  const input = await parseBody(addContactChannelSchema, req)
  const channel = await contactsService.addContactChannel(ctx, contactId, input)
  return jsonCreated(channel)
}

export const updateChannel: WorkspaceHandler = async (req, { ctx, params }) => {
  const channelId = requireParam(params, 'id')
  const input = await parseBody(updateContactChannelSchema, req)
  const channel = await contactsService.updateContactChannel(ctx, channelId, input)
  return jsonOk(channel)
}

export const removeChannel: WorkspaceHandler = async (req, { ctx, params }) => {
  const channelId = requireParam(params, 'id')
  await contactsService.removeContactChannel(ctx, channelId)
  return jsonNoContent()
}

export const listLeadStatuses: WorkspaceHandler = async (req, { ctx }) => {
  const statuses = await contactsService.listLeadStatuses(ctx)
  return jsonOk(statuses)
}

export const listLeadSources: WorkspaceHandler = async (req, { ctx }) => {
  const sources = await contactsService.listLeadSources(ctx)
  return jsonOk(sources)
}
