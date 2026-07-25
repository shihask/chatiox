import type { ChannelType } from '@/lib/channelTypes'

// Mirrors supabase/functions/api/dtos/crm/contacts.dtos.ts -- keep in sync.
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

export interface CreateContactChannelDTO {
  channelType: ChannelType
  value: string
  isPrimary?: boolean
}

export interface CreateContactDTO {
  firstName: string
  lastName?: string
  tags?: string[]
  channels: CreateContactChannelDTO[]
  leadStatusId?: string
  leadSourceId?: string
  assignedToUserId?: string
}

export interface UpdateContactDTO {
  firstName?: string
  lastName?: string | null
  tags?: string[]
  leadStatusId?: string | null
  leadSourceId?: string | null
  assignedToUserId?: string | null
}

export interface ListContactsParams {
  page?: number
  pageSize?: number
  search?: string
  leadStatusId?: string
  leadSourceId?: string
  assignedToUserId?: string
}

export interface NoteDTO {
  id: string
  workspaceId: string
  contactId: string
  body: string
  createdBy: string | null
  createdAt: string
}

export interface CreateNoteDTO {
  body: string
}
