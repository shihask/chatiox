import { z } from 'npm:zod@4'

// Mirrors src/features/administration/team-members/schemas/*.schema.ts on the frontend -- keep in sync.
const workspaceRoleSchema = z.enum(['owner', 'admin', 'manager', 'agent'])

// Invites can never mint another owner -- ownership only transfers via updateMemberRoleSchema,
// and only an existing owner is allowed to grant it (enforced in update_member_role()).
export const createInviteSchema = z.object({
  email: z.email(),
  role: z.enum(['admin', 'manager', 'agent']).default('agent'),
})
export type CreateInviteInput = z.infer<typeof createInviteSchema>

export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
})
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
