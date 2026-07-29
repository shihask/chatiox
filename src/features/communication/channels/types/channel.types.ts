// Mirrors supabase/functions/api/dtos/communication/channels.dtos.ts -- keep in sync.
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

export interface UpdateConnectionDTO {
  displayName?: string
  externalAccountId?: string | null
  metadata?: Record<string, unknown>
  secret?: Record<string, unknown>
  status?: 'connected' | 'disconnected' | 'error'
}

/** One phone number discovered via Embedded Signup -- never includes the access token itself,
 * only the opaque secretId reference used to complete the connection. */
export interface EmbeddedSignupCandidateDTO {
  wabaId: string
  phoneNumberId: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: string | null
  messagingLimitTier: string | null
}

export interface EmbeddedSignupDiscoveryDTO {
  secretId: string
  candidates: EmbeddedSignupCandidateDTO[]
}
