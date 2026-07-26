import { z } from 'npm:zod@4'

// Mirrors src/features/administration/workspace/schemas/*.schema.ts on the frontend -- keep in sync.
export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
})
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>

export const createLeadStatusSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
})
export type CreateLeadStatusInput = z.infer<typeof createLeadStatusSchema>

export const updateLeadStatusSchema = z.object({
  name: z.string().min(1).optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
})
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>

export const createLeadSourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})
export type CreateLeadSourceInput = z.infer<typeof createLeadSourceSchema>

export const updateLeadSourceSchema = z.object({
  name: z.string().min(1),
})
export type UpdateLeadSourceInput = z.infer<typeof updateLeadSourceSchema>
