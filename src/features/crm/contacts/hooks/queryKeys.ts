import type { ListContactsParams } from '@/features/crm/contacts/types/contact.types'

export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (params: ListContactsParams) => [...contactsKeys.lists(), params] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
}

export const leadStatusesKeys = {
  all: ['lead-statuses'] as const,
}

export const leadSourcesKeys = {
  all: ['lead-sources'] as const,
}

export const notesKeys = {
  all: ['notes'] as const,
  byContact: (contactId: string) => [...notesKeys.all, contactId] as const,
}
