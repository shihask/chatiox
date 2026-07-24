# Administration: Billing

## Status

Not implemented in Phase 1. Real nav item (sidebar → Billing), currently rendering `ComingSoonPage`.

## Model

```
Workspace -> Subscription -> Plan -> Usage
```

Never a subscription-tier field bolted directly onto the workspace/tenant row -- this layering leaves room for free/trial/monthly/annual/usage-based plans without a future schema rework.

## Data shapes (documented now, no tables built yet)

```ts
interface PlanDTO {
  id: string
  name: string
  priceMonthly: number | null
  priceAnnual: number | null
  contactLimit: number | null
  messageLimit: number | null
  features: string[]
}
interface SubscriptionDTO {
  id: string
  workspaceId: string
  planId: string
  status: 'trialing' | 'active' | 'past_due' | 'cancelled'
  currentPeriodEnd: string
  trialEndsAt: string | null
}
interface UsageDTO {
  workspaceId: string
  periodStart: string
  periodEnd: string
  contactsCount: number
  messagesSentCount: number
}
```

## Implementation checklist (when this is built)

- [ ] Migrations: `plans` (platform-wide, like `channel_types` -- not per-workspace), `subscriptions`, `usage_snapshots`, RLS scoped like `contacts` where tenant-specific
- [ ] Likely integrates a payment provider (Stripe or similar) -- webhook receipt for that provider is a separate concern from the `/webhooks/<channel>` messaging-provider family already reserved in the architecture (§9), not the same "webhook" tier
- [ ] `administration/billing.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts` -- writes restricted to `owner` only
