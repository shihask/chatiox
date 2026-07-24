// Mirrors docs/modules/analytics/analytics.md -- not implemented yet, no backend route exists.
export interface LeadSourcePerformanceRowDTO {
  leadSourceId: string
  leadSourceName: string
  leadsCount: number
  interestedCount: number
  convertedCount: number
  lostCount: number
}

export interface DashboardKpisDTO {
  newLeadsCount: number
  followUpsDueCount: number
  openTasksCount: number
  messagesSentTodayCount: number
  campaignsRunningCount: number
}
