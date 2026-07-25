import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analyticsApi'
import { analyticsKeys } from '@/features/analytics/hooks/queryKeys'

export function useLeadStatusDistribution() {
  return useQuery({
    queryKey: analyticsKeys.leadStatusDistribution(),
    queryFn: () => analyticsApi.leadStatusDistribution(),
  })
}
