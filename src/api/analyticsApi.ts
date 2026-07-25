import { apiClient } from '@/api/apiClient'
import type {
  LeadsBySourceRowDTO,
  LeadStatusDistributionRowDTO,
} from '@/features/analytics/types/analytics.types'

export const analyticsApi = {
  leadsBySource: () => apiClient.get<LeadsBySourceRowDTO[]>('/analytics/leads-by-source'),
  leadStatusDistribution: () =>
    apiClient.get<LeadStatusDistributionRowDTO[]>('/analytics/lead-status-distribution'),
}
