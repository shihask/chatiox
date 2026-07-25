import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analyticsApi'
import { analyticsKeys } from '@/features/analytics/hooks/queryKeys'

export function useLeadsBySource() {
  return useQuery({
    queryKey: analyticsKeys.leadsBySource(),
    queryFn: () => analyticsApi.leadsBySource(),
  })
}
