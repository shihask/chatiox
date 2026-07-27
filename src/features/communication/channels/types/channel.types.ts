// Mirrors supabase/functions/api/dtos/communication/channels.dtos.ts -- keep in sync.
// Schema + service layer are implemented (see docs/modules/communication/channels.md); blocked on
// a concrete IChannelProvider before there's a real setup flow to build. No API client/hooks/pages yet.
import type { ChannelType } from '@/lib/channelTypes'

export interface ChannelCapabilities {
  readonly supportsTemplates: boolean
  readonly supportsMedia: boolean
  readonly supportsButtons: boolean
  readonly supportsLists: boolean
  readonly supportsLocation: boolean
  readonly supportsReactions: boolean
  readonly supportsContacts: boolean
  readonly supportsTyping: boolean
  readonly supportsReadReceipts: boolean
  readonly supportsFlows: boolean
  readonly supportsEditingMessages: boolean
}

/** Never includes the secret -- credentials are Vault-backed and only ever resolved server-side. */
export interface ChannelConnectionDTO {
  id: string
  workspaceId: string
  channelType: ChannelType
  displayName: string
  externalAccountId: string | null
  metadata: Record<string, unknown>
  status: 'connected' | 'disconnected' | 'error'
  lastError: string | null
  connectedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateConnectionDTO {
  channelType: ChannelType
  displayName: string
  externalAccountId?: string
  metadata?: Record<string, unknown>
  secret: Record<string, unknown>
}
