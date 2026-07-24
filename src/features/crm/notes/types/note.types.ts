// Mirrors docs/modules/crm/notes.md -- not implemented yet, no backend route exists.
export interface NoteDTO {
  id: string
  workspaceId: string
  contactId: string
  body: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteDTO {
  contactId: string
  body: string
}

export interface UpdateNoteDTO {
  body: string
}
