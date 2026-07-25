import { parseBody } from '../../../_shared/validate.ts'
import { jsonCreated, jsonNoContent, jsonOk } from '../../../_shared/response.ts'
import { BadRequestError } from '../../../_shared/errors.ts'
import type { WorkspaceHandler } from '../../../_shared/http/requestContext.ts'
import * as notesService from '../../services/crm/notes.service.ts'
import { createNoteSchema } from '../../schemas/crm/notes.schemas.ts'

function requireParam(params: Record<string, string | undefined>, name: string): string {
  const value = params[name]
  if (!value) throw new BadRequestError(`Missing route parameter: ${name}`)
  return value
}

export const list: WorkspaceHandler = async (req, { ctx, params }) => {
  const contactId = requireParam(params, 'id')
  const notes = await notesService.listNotes(ctx, contactId)
  return jsonOk(notes)
}

export const create: WorkspaceHandler = async (req, { ctx, params }) => {
  const contactId = requireParam(params, 'id')
  const input = await parseBody(createNoteSchema, req)
  const note = await notesService.createNote(ctx, contactId, input)
  return jsonCreated(note)
}

export const remove: WorkspaceHandler = async (req, { ctx, params }) => {
  const id = requireParam(params, 'id')
  await notesService.deleteNote(ctx, id)
  return jsonNoContent()
}
