import type { ChannelType } from '../../../_shared/channelTypes.ts'

/** Never includes the secret or secret_id -- credentials are Vault-backed and only ever resolved
 * server-side via channels.repository.ts's resolveForSending(), never serialized to a client. */
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

/** One phone number discovered via Embedded Signup that the exchanged token has access to --
 * never includes the access token itself, only the opaque secretId reference (see
 * channels.repository.ts's storeSecret/getSecretById). */
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
