import type { ChannelType } from './channelTypes.ts'

function toE164(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  return digits.startsWith('+') ? digits : `+${digits}`
}

/** Shared by contacts (normalize on write) and channels (normalize inbound webhook senders so
 * lookups against contact_channels.value match) -- see docs/architecture.md §3. */
export function normalizeChannelValue(channelType: ChannelType, raw: string): string {
  switch (channelType) {
    case 'whatsapp':
    case 'sms':
    case 'rcs':
      return toE164(raw)
    case 'email':
      return raw.trim().toLowerCase()
    case 'telegram':
    case 'instagram':
    case 'messenger':
      return raw.trim().replace(/^@/, '').toLowerCase()
  }
}
