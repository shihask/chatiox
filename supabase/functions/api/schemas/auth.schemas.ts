import { z } from 'npm:zod@4'

// Mirrors src/features/auth/schemas/*.schema.ts on the frontend -- keep in sync.
// companyName is only required when there's no inviteToken -- joining an existing workspace via
// invite doesn't involve naming one (see team-members.service.ts's signup branch).
export const signupSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    companyName: z.string().min(1).optional(),
    inviteToken: z.uuid().optional(),
  })
  .refine((data) => Boolean(data.inviteToken) || Boolean(data.companyName?.trim()), {
    message: 'Workspace name is required',
    path: ['companyName'],
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
