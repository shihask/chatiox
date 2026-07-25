export interface LeadsBySourceRowDTO {
  leadSourceId: string
  leadSourceName: string
  sortOrder: number
  total: number
  won: number
  lost: number
}

export interface LeadStatusDistributionRowDTO {
  leadStatusId: string
  leadStatusName: string
  sortOrder: number
  isWon: boolean
  isLost: boolean
  total: number
}
