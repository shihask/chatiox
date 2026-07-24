// Canonical ChannelType union -- the join point between contacts and channels with no circular
// dependency (see docs/architecture.md §3). Mirrors src/lib/channelTypes.ts on the frontend and
// the public.channel_types table -- changing this list means updating all three.
export const CHANNEL_TYPES = [
  'whatsapp',
  'email',
  'sms',
  'telegram',
  'instagram',
  'messenger',
  'rcs',
] as const

export type ChannelType = (typeof CHANNEL_TYPES)[number]

export function isChannelType(value: string): value is ChannelType {
  return (CHANNEL_TYPES as readonly string[]).includes(value)
}
