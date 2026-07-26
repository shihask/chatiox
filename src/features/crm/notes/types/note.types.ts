// Mirrors supabase/functions/api/dtos/crm/notes.dtos.ts -- keep in sync.
export interface NoteContactSummaryDTO {
  id: string
  firstName: string
  lastName: string | null
}

export interface NoteDTO {
  id: string
  workspaceId: string
  contactId: string
  contact: NoteContactSummaryDTO | null
  body: string
  createdBy: string | null
  createdAt: string
}

export interface CreateNoteDTO {
  body: string
}

export interface ListNotesParams {
  page?: number
  pageSize?: number
  search?: string
  contactId?: string
  authorId?: string
}
