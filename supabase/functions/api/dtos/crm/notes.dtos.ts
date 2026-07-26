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
