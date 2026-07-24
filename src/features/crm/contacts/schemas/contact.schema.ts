import { z } from 'zod'
import { CHANNEL_TYPES } from '@/lib/channelTypes'
import { isValidE164 } from '@/lib/phone'

const PHONE_CHANNEL_TYPES = new Set(['whatsapp', 'sms', 'rcs'])
const HANDLE_CHANNEL_TYPES = new Set(['telegram', 'instagram', 'messenger'])

export const contactChannelFormSchema = z
  .object({
    id: z.string().optional(),
    channelType: z.enum(CHANNEL_TYPES),
    value: z.string().min(1, 'Value is required'),
    isPrimary: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (PHONE_CHANNEL_TYPES.has(data.channelType) && !isValidE164(data.value)) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Enter a valid phone number in international format (e.g. +14155552671)',
      })
    }
    if (data.channelType === 'email' && !z.email().safeParse(data.value).success) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter a valid email address' })
    }
    if (HANDLE_CHANNEL_TYPES.has(data.channelType) && data.value.trim().length < 1) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter a handle' })
    }
  })
export type ContactChannelFormValues = z.infer<typeof contactChannelFormSchema>

export const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  tags: z.array(z.string()),
  channels: z.array(contactChannelFormSchema).min(1, 'At least one channel is required'),
  leadStatusId: z.string().optional(),
  leadSourceId: z.string().optional(),
  assignedToUserId: z.string().optional(),
})
export type ContactFormValues = z.infer<typeof contactFormSchema>
