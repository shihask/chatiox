# Marketing: Campaigns

## Status

Not implemented in Phase 1. Real nav item (sidebar → Marketing → Campaigns), currently rendering `ComingSoonPage`.

## Model

```
Campaign -> Audience -> Message -> Channel -> Delivery -> Analytics
```

Never `Campaign -> WhatsAppCampaign`. A Campaign is channel-agnostic (name, schedule, audience definition); channel-awareness enters only through which `IChannelProvider` a Delivery is sent via.

## Campaigns target CRM Contacts directly -- never duplicate contact data

Audience is a filter definition evaluated against `contacts` (`tags`, `lead_status_id`, `lead_source_id`, and eventually Segments) -- never a copied list of contact fields. This mirrors the same non-duplication discipline already established for Contacts throughout Phase 1 (see "Contact Merge" in `docs/architecture.md`'s Future CRM Extensions note): every record that references a contact does so by `contact_id` FK only.

## Campaign attribution (reserved, not built)

A future `Delivery`/recipient record carries the originating `campaign_id`. This is what lets a Contact's `lead_source_id` stay generic ("WhatsApp", "Instagram") while the _specific_ campaign that produced the lead remains traceable end-to-end:

```
Instagram Ad -> "Python July Campaign" -> Rahul -> Lead Created
```

Without this, future cost-per-lead and campaign ROI reporting would require a schema change later -- reserving the FK now avoids that.

## Data shapes (documented now, no tables built yet)

```ts
interface CampaignDTO {
  id: string
  workspaceId: string
  name: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled'
  campaignType: 'campaign' | 'broadcast' // see marketing/broadcast.md -- not a separate entity
  audienceId: string
  messageId: string
  channelType: ChannelType
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
}
interface AudienceDTO {
  id: string
  workspaceId: string
  name: string
  filterDefinition: unknown // future: tag/lead-status/lead-source/segment query builder JSON
  contactCount: number | null
}
interface CampaignMessageDTO {
  id: string
  campaignId: string
  channelTemplateId: string | null // see marketing/templates.md
  body: string | null
  mediaUrl: string | null
  variables: Record<string, string> | null
}
interface DeliveryDTO {
  id: string
  campaignId: string
  contactId: string
  channelType: ChannelType
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  providerMessageId: string | null
  failureReason: string | null
  sentAt: string | null
  deliveredAt: string | null
}
interface CampaignAnalyticsDTO {
  campaignId: string
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  clickCount: number | null
}
```

Future events (documented, not typed in `_shared/events.ts` yet -- add only once this module is actually built): `CampaignCreated`, `CampaignLaunched`, `MessageDelivered`, `MessageFailed`.

## Implementation checklist (when this is built)

- [ ] `marketing/campaigns.schemas.ts` / `.dtos.ts` / `.mapper.ts` / `.repository.ts` / `.service.ts` / `.controller.ts` / `.routes.ts`
- [ ] Migrations: `campaigns`, `audiences`, `campaign_messages`, `campaign_deliveries`, RLS scoped like `contacts`
- [ ] Sending goes through `docs/modules/jobs.md`'s Queue -> Worker -> Provider pattern, never synchronous fan-out inside a request
- [ ] Wire `recordAudit()`/`emit()` for the events above, feeding the future Timeline (see `crm/timeline.md`)
