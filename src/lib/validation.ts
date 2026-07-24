import { z } from 'zod'
import { isValidE164 } from '@/lib/phone'

export const e164PhoneSchema = z
  .string()
  .refine(isValidE164, 'Enter a valid phone number in international format (e.g. +14155552671)')

export const emailSchema = z.email('Enter a valid email address')

export const handleSchema = (label: string) =>
  z
    .string()
    .min(1, `Enter a ${label} handle`)
    .transform((value) => value.trim().replace(/^@/, ''))
