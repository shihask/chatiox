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
