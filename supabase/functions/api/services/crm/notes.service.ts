import { recordAudit } from '../../../_shared/audit.ts'
import { emit } from '../../../_shared/events.ts'
import type { WorkspaceRequestContext } from '../../../_shared/http/requestContext.ts'
import * as notesRepository from '../../repositories/crm/notes.repository.ts'
import { mapNoteRowToDTO } from '../../mappers/crm/notes.mapper.ts'
import type { CreateNoteInput } from '../../schemas/crm/notes.schemas.ts'
import type { NoteDTO } from '../../dtos/crm/notes.dtos.ts'

export async function listNotes(ctx: WorkspaceRequestContext, contactId: string): Promise<NoteDTO[]> {
  const rows = await notesRepository.listByContact(ctx.supabase, ctx.workspaceId, contactId)
  return rows.map(mapNoteRowToDTO)
}

export async function createNote(
  ctx: WorkspaceRequestContext,
  contactId: string,
  input: CreateNoteInput,
): Promise<NoteDTO> {
  const row = await notesRepository.create(ctx.supabase, ctx.workspaceId, contactId, input.body, ctx.userId)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'note.created',
    targetType: 'note',
    targetId: row.id,
    metadata: { contactId },
  })
  emit({
    type: 'NoteCreated',
    workspaceId: ctx.workspaceId,
    contactId,
    noteId: row.id,
    actorUserId: ctx.userId,
    occurredAt: new Date().toISOString(),
  })

  return mapNoteRowToDTO(row)
}

export async function deleteNote(ctx: WorkspaceRequestContext, id: string): Promise<void> {
  await notesRepository.remove(ctx.supabase, ctx.workspaceId, id)

  await recordAudit(ctx.supabase, {
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: 'note.deleted',
    targetType: 'note',
    targetId: id,
  })
}
