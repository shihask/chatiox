import { parseBody, parseQuery } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk, jsonPaginated } from '../../../_shared/response.ts'
import { buildPaginationMeta } from '../../../_shared/pagination.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as notesService from '../../services/crm/notes.service.ts'
import { createNoteSchema, listNotesQuerySchema } from '../../schemas/crm/notes.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const listByContact: WorkspaceHandler = async (req, { ctx, params }) => {
  const contactId = requireParam(params, 'id')
  const notes = await notesService.listNotesByContact(ctx, contactId)
  return jsonOk(notes)
}

export const createForContact: WorkspaceHandler = async (req, { ctx, params }) => {
  const contactId = requireParam(params, 'id')
  const input = await parseBody(createNoteSchema, req)
  const note = await notesService.createNote(ctx, contactId, input)
  return jsonCreated(note)
}

export const list: WorkspaceHandler = async (req, { ctx }) => {
  const query = parseQuery(listNotesQuerySchema, new URL(req.url))
  const page = await notesService.listNotes(ctx, query)
  return jsonPaginated(page.items, buildPaginationMeta(page.page, page.pageSize, page.total))
}

export const remove: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await notesService.deleteNote(ctx, id)
  return jsonNoContent()
}
