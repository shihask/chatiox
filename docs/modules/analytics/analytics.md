# Analytics

## Status

Not implemented in Phase 1. Real nav item (sidebar → Analytics, flat), currently rendering `ComingSoonPage`.

## Purpose

Combines CRM + Communication + Marketing + Automation into read-only reporting: New Leads, Leads by Source, Lead Conversion, Lead Status Distribution, Messages Sent/Delivered/Read, Replies, Campaign Performance, Agent Performance, future Revenue Attribution. All queryable from data Phase 1 already models (`lead_status_id`, `lead_source_id` on `contacts`) plus future Communication/Marketing tables -- no schema redesign needed to support this later.

## Flagship report: Lead Source performance

One of the most-requested CRM views, and Phase 1's schema already supports it directly (no new tables needed, just a future read-only aggregate query/view):

```
Source        Leads   Interested   Converted   Lost
Instagram     120     70           18          12
Facebook      80      30           6           20
Google Ads    35      20           12          3
Reference     20      18           16          1
```

Grouped `count(*)` over `contacts` by `lead_source_id`, cross-tabbed against `lead_statuses.is_won`/`is_lost`.

## Dashboard's growth path

Phase 1's Dashboard (`src/features/dashboard/DashboardPage.tsx`) is deliberately minimal -- a welcome heading, workspace name, and total contact count. Its natural next iteration, once Tasks/Communication/Marketing exist, is a small row of KPI cards: New Leads, Today's Follow-ups, Open Tasks, Messages Today, Campaigns Running. No charts needed at that stage, just counts -- full Analytics (this module) is where charts/reports eventually live.

## Data shapes (documented now, no tables/views built yet)

```ts
interface LeadSourcePerformanceRowDTO {
  leadSourceId: string
  leadSourceName: string
  leadsCount: number
  interestedCount: number
  convertedCount: number
  lostCount: number
}
interface DashboardKpisDTO {
  newLeadsCount: number
  followUpsDueCount: number
  openTasksCount: number
  messagesSentTodayCount: number
  campaignsRunningCount: number
}
```

## Implementation checklist (when this is built)

- [ ] `analytics/analytics.schemas.ts` / `.dtos.ts` / `.repository.ts` / `.service.ts` / `.controller.ts` / `.routes.ts` -- likely read-only, no `mappers`/write-DTOs needed beyond query params
- [ ] Backed by SQL views or materialized views over `contacts`/`lead_statuses`/`lead_sources` plus future Communication/Marketing tables, not application-level aggregation
- [ ] `GET /analytics/lead-sources`, `GET /analytics/dashboard-kpis`, etc. -- one endpoint per report, not a single do-everything endpoint
