# Marketing: Broadcast (not yet implemented)

Full spec: [`docs/modules/marketing/broadcast.md`](../../../../docs/modules/marketing/broadcast.md).

Status: sidebar entry renders `ComingSoonPage`. Not a separate backend entity -- reuses `CampaignDTO` with `campaignType: "broadcast"` (see `src/features/marketing/campaigns/types/campaign.types.ts`). This folder exists for a dedicated, simplified "send now" wizard UI, not a separate data model.
