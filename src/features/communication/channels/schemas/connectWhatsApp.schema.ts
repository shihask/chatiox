import { z } from 'zod'

export const connectWhatsAppSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  wabaId: z.string().optional(),
  accessToken: z.string().min(1, 'Access token is required'),
})
export type ConnectWhatsAppFormValues = z.infer<typeof connectWhatsAppSchema>
