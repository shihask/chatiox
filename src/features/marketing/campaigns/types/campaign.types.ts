// Mirrors docs/modules/marketing/campaigns.md -- not implemented yet, no backend route exists.
type ChannelType = 'whatsapp' | 'email' | 'sms' | 'telegram' | 'instagram' | 'messenger' | 'rcs'

export interface CampaignDTO {
  id: string
  workspaceId: string
  name: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled'
  campaignType: 'campaign' | 'broadcast'
  audienceId: string
  messageId: string
  channelType: ChannelType
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AudienceDTO {
  id: string
  workspaceId: string
  name: string
  filterDefinition: unknown
  contactCount: number | null
}

export interface CampaignMessageDTO {
  id: string
  campaignId: string
  channelTemplateId: string | null
  body: string | null
  mediaUrl: string | null
  variables: Record<string, string> | null
}

export interface DeliveryDTO {
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

export interface CampaignAnalyticsDTO {
  campaignId: string
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  clickCount: number | null
}
