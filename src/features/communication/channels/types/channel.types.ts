// Mirrors docs/modules/communication/channels.md -- not implemented yet, no backend route exists.
// ChannelType/ChannelCapabilities intentionally duplicated here rather than imported from the
// backend's api/channels/channel.types.ts (different runtime, Deno vs. Vite) -- reconcile the
// frontend copy in src/lib/channelTypes.ts once this module is actually implemented.
type ChannelType = 'whatsapp' | 'email' | 'sms' | 'telegram' | 'instagram' | 'messenger' | 'rcs'

export interface ChannelCapabilities {
  readonly supportsTemplates: boolean
  readonly supportsMedia: boolean
  readonly supportsButtons: boolean
  readonly supportsLocation: boolean
  readonly supportsReactions: boolean
}

export interface WorkspaceChannelConnectionDTO {
  id: string
  workspaceId: string
  channelType: ChannelType
  isActive: boolean
  capabilities: ChannelCapabilities
  connectedAt: string | null
}
