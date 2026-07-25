import { z } from 'zod'

// Mirrors supabase/functions/api/schemas/crm/tasks.schemas.ts -- keep in sync.
export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  dueAt: z.string(),
  assignedToUserId: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
