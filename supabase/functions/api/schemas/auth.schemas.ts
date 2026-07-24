import { z } from 'npm:zod@4'

// Mirrors src/features/auth/schemas/*.schema.ts on the frontend -- keep in sync.
export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(1, 'Workspace name is required'),
})
export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})
export type RefreshInput = z.infer<typeof refreshSchema>
