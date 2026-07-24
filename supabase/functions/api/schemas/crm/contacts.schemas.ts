import { z } from 'npm:zod@4'
import { CHANNEL_TYPES } from '../../../_shared/channelTypes.ts'

// Mirrors src/features/crm/contacts/schemas/contact.schema.ts on the frontend -- keep in sync.
const channelTypeSchema = z.enum(CHANNEL_TYPES)

const contactChannelInputSchema = z.object({
  channelType: channelTypeSchema,
  value: z.string().min(1, 'Value is required'),
  isPrimary: z.boolean().optional(),
})

export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  channels: z.array(contactChannelInputSchema).min(1, 'At least one channel is required'),
  leadStatusId: z.uuid().optional(),
  leadSourceId: z.uuid().optional(),
  assignedToUserId: z.uuid().optional(),
})
export type CreateContactInput = z.infer<typeof createContactSchema>

export const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  leadStatusId: z.uuid().nullable().optional(),
  leadSourceId: z.uuid().nullable().optional(),
  assignedToUserId: z.uuid().nullable().optional(),
})
export type UpdateContactInput = z.infer<typeof updateContactSchema>

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  leadStatusId: z.uuid().optional(),
  leadSourceId: z.uuid().optional(),
  assignedToUserId: z.uuid().optional(),
})
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>

export const addContactChannelSchema = contactChannelInputSchema
export type AddContactChannelInput = z.infer<typeof addContactChannelSchema>

export const updateContactChannelSchema = z.object({
  value: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
})
export type UpdateContactChannelInput = z.infer<typeof updateContactChannelSchema>
