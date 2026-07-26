import { z } from 'zod'

// Mirrors supabase/functions/api/schemas/auth.schemas.ts -- keep in sync.
export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

// companyName is only required when there's no inviteToken -- joining an existing workspace via
// invite doesn't involve naming one.
export const signupSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    companyName: z.string().min(1).optional(),
    inviteToken: z.string().optional(),
  })
  .refine((data) => Boolean(data.inviteToken) || Boolean(data.companyName?.trim()), {
    message: 'Workspace name is required',
    path: ['companyName'],
  })
export type SignupFormValues = z.infer<typeof signupSchema>
