import {
  MessageCircle,
  Mail,
  MessageSquare,
  Send,
  Image,
  MessagesSquare,
  Radio,
  Phone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Mirrors supabase/functions/_shared/channelTypes.ts -- keep the value list in sync.
export const CHANNEL_TYPES = [
  'whatsapp',
  'email',
  'sms',
  'telegram',
  'instagram',
  'messenger',
  'rcs',
  'voice',
] as const

export type ChannelType = (typeof CHANNEL_TYPES)[number]

export function isChannelType(value: string): value is ChannelType {
  return (CHANNEL_TYPES as readonly string[]).includes(value)
}

export const CHANNEL_TYPE_META: Record<ChannelType, { label: string; icon: LucideIcon }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: MessageSquare },
  telegram: { label: 'Telegram', icon: Send },
  instagram: { label: 'Instagram', icon: Image },
  messenger: { label: 'Messenger', icon: MessagesSquare },
  rcs: { label: 'RCS', icon: Radio },
  voice: { label: 'Voice', icon: Phone },
}
