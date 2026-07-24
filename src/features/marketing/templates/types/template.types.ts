// Mirrors docs/modules/marketing/templates.md -- not implemented yet, no backend route exists.
type ChannelType = 'whatsapp' | 'email' | 'sms' | 'telegram' | 'instagram' | 'messenger' | 'rcs'

export interface ChannelTemplateDTO {
  id: string
  templateId: string
  channelType: ChannelType
  providerTemplateId: string | null
  body: string
  variables: string[]
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
}

export interface TemplateDTO {
  id: string
  workspaceId: string
  name: string
  category: string | null
  channelTemplates: ChannelTemplateDTO[]
}
