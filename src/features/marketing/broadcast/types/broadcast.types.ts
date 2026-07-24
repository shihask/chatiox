// Mirrors docs/modules/marketing/broadcast.md -- not implemented yet, no backend route exists.
// Broadcast is NOT a separate entity: it's a CampaignDTO with campaignType: "broadcast" and
// scheduledAt: null. Re-exported here (not duplicated) so this feature folder has its own
// import path without inventing a second shape.
export type { CampaignDTO as BroadcastDTO } from '@/features/marketing/campaigns/types/campaign.types'
