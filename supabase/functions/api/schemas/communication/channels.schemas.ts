import { z } from 'npm:zod@4'
import { CHANNEL_TYPES } from '../../../_shared/channelTypes.ts'

// Mirrors src/features/communication/channels/schemas/*.schema.ts on the frontend -- keep in sync.
export const createConnectionSchema = z.object({
  channelType: z.enum(CHANNEL_TYPES),
  displayName: z.string().min(1, 'Display name is required'),
  externalAccountId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  secret: z.record(z.string(), z.unknown()),
})
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>

export const discoverEmbeddedSignupAssetsSchema = z.object({
  code: z.string().min(1),
})
export type DiscoverEmbeddedSignupAssetsInput = z.infer<typeof discoverEmbeddedSignupAssetsSchema>

export const completeEmbeddedSignupSchema = z.object({
  secretId: z.string().min(1),
  wabaId: z.string().min(1),
  phoneNumberId: z.string().min(1),
})
export type CompleteEmbeddedSignupInput = z.infer<typeof completeEmbeddedSignupSchema>

export const updateConnectionSchema = z.object({
  displayName: z.string().min(1).optional(),
  externalAccountId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  secret: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['connected', 'disconnected', 'error']).optional(),
})
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>
