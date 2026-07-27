import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { ChannelConnectionDTO } from '../../dtos/communication/channels.dtos.ts'
import type { ChannelConnectionRow } from '../../repositories/communication/channels.repository.ts'

/** The exact tenant_id -> workspaceId translation point (see docs/architecture.md §2). Deliberately
 * omits secret_id -- never surfaced past this layer. */
export function mapChannelConnectionRowToDTO(row: ChannelConnectionRow): ChannelConnectionDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    channelType: row.channel_type as ChannelType,
    displayName: row.display_name,
    externalAccountId: row.external_account_id,
    metadata: row.metadata,
    status: row.status as ChannelConnectionDTO['status'],
    lastError: row.last_error,
    connectedBy: row.connected_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
