import type { ChannelType } from '../../../_shared/channelTypes.ts'

export interface TemplateDTO {
  id: string
  workspaceId: string
  name: string
  purpose: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** Read/sync only this pass -- rows are populated by a future "sync approved templates from Meta"
 * action, not authored in Chatiox's UI (see docs/modules/marketing/templates.md). */
export interface ChannelTemplateDTO {
  id: string
  workspaceId: string
  templateId: string
  channelConnectionId: string
  channelType: ChannelType
  providerTemplateName: string
  languageCode: string
  category: string | null
  body: string | null
  variables: unknown[]
  status: 'pending' | 'approved' | 'rejected'
  providerTemplateId: string | null
  createdAt: string
  updatedAt: string
}
