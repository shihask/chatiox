import { z } from 'npm:zod@4'

// Mirrors src/features/crm/tasks/schemas/task.schema.ts on the frontend -- keep in sync.
const taskStatusSchema = z.enum(['open', 'completed', 'cancelled'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueAt: z.string().optional(),
  assignedToUserId: z.uuid().optional(),
})
export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  status: taskStatusSchema.optional(),
  assignedToUserId: z.uuid().nullable().optional(),
})
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: taskStatusSchema.optional(),
  assignedToUserId: z.uuid().optional(),
  contactId: z.uuid().optional(),
})
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>
