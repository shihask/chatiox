import { z } from 'npm:zod@4'

// Mirrors src/features/crm/notes/schemas/note.schema.ts on the frontend -- keep in sync.
export const createNoteSchema = z.object({
  body: z.string().min(1, 'Note cannot be empty').max(4000, 'Note is too long'),
})
export type CreateNoteInput = z.infer<typeof createNoteSchema>

export const listNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  contactId: z.uuid().optional(),
  authorId: z.uuid().optional(),
})
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>
