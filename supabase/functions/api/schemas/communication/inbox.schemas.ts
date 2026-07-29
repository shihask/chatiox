import { z } from 'npm:zod@4'
import { CHANNEL_TYPES } from '../../../_shared/channelTypes.ts'

export const listConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['open', 'pending', 'closed']).optional(),
  assignedToUserId: z.uuid().optional(),
  channelType: z.enum(CHANNEL_TYPES).optional(),
  unassigned: z.coerce.boolean().optional(),
})
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>

export const startConversationSchema = z.object({
  contactId: z.uuid(),
  channelType: z.enum(CHANNEL_TYPES),
})
export type StartConversationInput = z.infer<typeof startConversationSchema>

export const updateConversationSchema = z.object({
  status: z.enum(['open', 'pending', 'closed']).optional(),
  assignedToUserId: z.uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
})
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>

export const linkContactSchema = z.object({
  contactId: z.uuid(),
})
export type LinkContactInput = z.infer<typeof linkContactSchema>

export const createContactForConversationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
})
export type CreateContactForConversationInput = z.infer<typeof createContactForConversationSchema>

export const sendMessageSchema = z.object({
  text: z.string().min(1).optional(),
  template: z
    .object({
      name: z.string().min(1),
      languageCode: z.string().optional(),
      variables: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
}).refine((data) => Boolean(data.text?.trim()) || Boolean(data.template), {
  message: 'Either text or a template is required',
  path: ['text'],
})
export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const createConversationNoteSchema = z.object({
  body: z.string().min(1, 'Note cannot be empty').max(4000, 'Note is too long'),
})
export type CreateConversationNoteInput = z.infer<typeof createConversationNoteSchema>

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>
