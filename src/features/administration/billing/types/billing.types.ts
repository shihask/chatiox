// Mirrors docs/modules/administration/billing.md -- not implemented yet, no backend route exists.
export interface PlanDTO {
  id: string
  name: string
  priceMonthly: number | null
  priceAnnual: number | null
  contactLimit: number | null
  messageLimit: number | null
  features: string[]
}

export interface SubscriptionDTO {
  id: string
  workspaceId: string
  planId: string
  status: 'trialing' | 'active' | 'past_due' | 'cancelled'
  currentPeriodEnd: string
  trialEndsAt: string | null
}

export interface UsageDTO {
  workspaceId: string
  periodStart: string
  periodEnd: string
  contactsCount: number
  messagesSentCount: number
}
