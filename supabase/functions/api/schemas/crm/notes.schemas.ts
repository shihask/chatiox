import { z } from 'npm:zod@4'

// Mirrors src/features/crm/contacts/schemas/note.schema.ts on the frontend -- keep in sync.
export const createNoteSchema = z.object({
  body: z.string().min(1, 'Note cannot be empty').max(4000, 'Note is too long'),
})
export type CreateNoteInput = z.infer<typeof createNoteSchema>
