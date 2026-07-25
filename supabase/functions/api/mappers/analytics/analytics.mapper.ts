import type { LeadsBySourceRowDTO, LeadStatusDistributionRowDTO } from '../../dtos/analytics/analytics.dtos.ts'

export interface LeadsBySourceRow {
  lead_source_id: string
  lead_source_name: string
  sort_order: number
  total: number
  won: number
  lost: number
}

export interface LeadStatusDistributionRow {
  lead_status_id: string
  lead_status_name: string
  sort_order: number
  is_won: boolean
  is_lost: boolean
  total: number
}

export function mapLeadsBySourceRowToDTO(row: LeadsBySourceRow): LeadsBySourceRowDTO {
  return {
    leadSourceId: row.lead_source_id,
    leadSourceName: row.lead_source_name,
    sortOrder: row.sort_order,
    total: row.total,
    won: row.won,
    lost: row.lost,
  }
}

export function mapLeadStatusDistributionRowToDTO(row: LeadStatusDistributionRow): LeadStatusDistributionRowDTO {
  return {
    leadStatusId: row.lead_status_id,
    leadStatusName: row.lead_status_name,
    sortOrder: row.sort_order,
    isWon: row.is_won,
    isLost: row.is_lost,
    total: row.total,
  }
}
