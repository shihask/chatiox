export const analyticsKeys = {
  all: ['analytics'] as const,
  leadsBySource: () => [...analyticsKeys.all, 'leads-by-source'] as const,
  leadStatusDistribution: () => [...analyticsKeys.all, 'lead-status-distribution'] as const,
}
