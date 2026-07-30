// Mirrors supabase/functions/api/dtos/communication/templates.dtos.ts -- keep in sync.
import type { ChannelType } from '@/lib/channelTypes'

export interface TemplateDTO {
  id: string
  workspaceId: string
  name: string
  purpose: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** Read/sync only -- rows are populated by the "Sync from WhatsApp" action, not authored directly. */
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

export interface CreateTemplateDTO {
  name: string
  purpose?: string
}
