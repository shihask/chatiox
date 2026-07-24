# Marketing: Broadcast

## Status

Not implemented in Phase 1. Real nav item (sidebar → Marketing → Broadcast), currently rendering `ComingSoonPage`.

## Not a separate entity -- a Campaign discriminator

Broadcast is a send-now Campaign, reusing the exact same `Campaign -> Audience -> Message -> Channel -> Delivery -> Analytics` machinery from `marketing/campaigns.md` -- it is not a parallel data model.

```ts
// Same CampaignDTO from marketing/campaigns.md:
interface CampaignDTO {
  // ...
  campaignType: 'campaign' | 'broadcast' // the only thing that distinguishes a broadcast
  scheduledAt: string | null // broadcast rows are created with scheduledAt = null (send-now)
}
```

## UX

A minimal one-off "send now" wizard (pick Audience → pick Channel → Compose → Review → Launch) over the same underlying Audience/Delivery/Analytics machinery Campaigns already use -- deliberately avoids duplicated schema for what's conceptually the same lifecycle minus scheduling.

## Implementation checklist (when this is built)

- [ ] No new migration beyond what `marketing/campaigns.md` already requires -- just the `campaignType` column/discriminator on `campaigns`
- [ ] A dedicated, simplified frontend wizard (`src/features/marketing/broadcast/`) rather than reusing the full Campaign builder UI, even though the backend is shared
