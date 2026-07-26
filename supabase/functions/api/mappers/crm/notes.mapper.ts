import type { NoteDTO } from '../../dtos/crm/notes.dtos.ts'

export interface NoteContactRow {
  id: string
  first_name: string
  last_name: string | null
}

export interface NoteRow {
  id: string
  tenant_id: string
  contact_id: string
  body: string
  created_by: string | null
  created_at: string
  contacts?: NoteContactRow | null
}

/** The exact tenant_id -> workspaceId translation point (see docs/architecture.md §2). */
export function mapNoteRowToDTO(row: NoteRow): NoteDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    contactId: row.contact_id,
    contact: row.contacts
      ? { id: row.contacts.id, firstName: row.contacts.first_name, lastName: row.contacts.last_name }
      : null,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
