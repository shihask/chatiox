export interface NoteDTO {
  id: string
  workspaceId: string
  contactId: string
  body: string
  createdBy: string | null
  createdAt: string
}
