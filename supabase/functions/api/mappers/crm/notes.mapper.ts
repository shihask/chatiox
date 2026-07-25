import type { NoteDTO } from '../../dtos/crm/notes.dtos.ts'

export interface NoteRow {
  id: string
  tenant_id: string
  contact_id: string
  body: string
  created_by: string | null
  created_at: string
}

/** The exact tenant_id -> workspaceId translation point (see docs/architecture.md §2). */
export function mapNoteRowToDTO(row: NoteRow): NoteDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    contactId: row.contact_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
