import { z } from 'npm:zod@4'

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  purpose: z.string().optional(),
})
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
