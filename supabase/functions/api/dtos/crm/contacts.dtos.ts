import type { ChannelType } from '../../../_shared/channelTypes.ts'

export interface ContactChannelDTO {
  id: string
  channelType: ChannelType
  value: string
  isPrimary: boolean
  verifiedAt: string | null
  createdAt: string
}

export interface LeadStatusDTO {
  id: string
  name: string
  sortOrder: number
  isWon: boolean
  isLost: boolean
}

export interface LeadSourceDTO {
  id: string
  name: string
  sortOrder: number
}

export interface ContactDTO {
  id: string
  workspaceId: string
  firstName: string
  lastName: string | null
  tags: string[]
  channels: ContactChannelDTO[]
  leadStatus: LeadStatusDTO | null
  leadSource: LeadSourceDTO | null
  assignedToUserId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}
