import type { ChannelType } from '../../../_shared/channelTypes.ts'
import type { ContactChannelDTO, ContactDTO, LeadSourceDTO, LeadStatusDTO } from '../../dtos/crm/contacts.dtos.ts'

export interface ContactChannelRow {
  id: string
  channel_type: string
  value: string
  is_primary: boolean
  verified_at: string | null
  created_at: string
}

export interface LeadStatusRow {
  id: string
  name: string
  sort_order: number
  is_won: boolean
  is_lost: boolean
}

export interface LeadSourceRow {
  id: string
  name: string
  sort_order: number
}

export interface ContactRow {
  id: string
  tenant_id: string
  first_name: string
  last_name: string | null
  tags: string[]
  lead_status_id: string | null
  lead_source_id: string | null
  assigned_to_user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  contact_channels?: ContactChannelRow[] | null
  lead_statuses?: LeadStatusRow | null
  lead_sources?: LeadSourceRow | null
}

export function mapContactChannelRowToDTO(row: ContactChannelRow): ContactChannelDTO {
  return {
    id: row.id,
    channelType: row.channel_type as ChannelType,
    value: row.value,
    isPrimary: row.is_primary,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
  }
}

export function mapLeadStatusRowToDTO(row: LeadStatusRow): LeadStatusDTO {
  return { id: row.id, name: row.name, sortOrder: row.sort_order, isWon: row.is_won, isLost: row.is_lost }
}

export function mapLeadSourceRowToDTO(row: LeadSourceRow): LeadSourceDTO {
  return { id: row.id, name: row.name, sortOrder: row.sort_order }
}

/** The exact tenant_id -> workspaceId translation point (see docs/architecture.md §2). */
export function mapContactRowToDTO(row: ContactRow): ContactDTO {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    firstName: row.first_name,
    lastName: row.last_name,
    tags: row.tags,
    channels: (row.contact_channels ?? []).map(mapContactChannelRowToDTO),
    leadStatus: row.lead_statuses ? mapLeadStatusRowToDTO(row.lead_statuses) : null,
    leadSource: row.lead_sources ? mapLeadSourceRowToDTO(row.lead_sources) : null,
    assignedToUserId: row.assigned_to_user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
