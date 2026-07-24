import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from '@/api/contactsApi'
import { ApiError } from '@/api/apiClient'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'
import type { ContactDTO, UpdateContactDTO } from '@/features/crm/contacts/types/contact.types'
import type { ContactFormValues } from '@/features/crm/contacts/schemas/contact.schema'

interface SaveContactInput {
  id: string
  values: ContactFormValues
  originalChannels: ContactDTO['channels']
}

/**
 * The Contact form edits name/tags/lead-status/lead-source/assignee AND the channels array in one
 * "Save" click, but the backend only accepts channel edits through the granular
 * POST /contacts/:id/channels, PATCH /contact-channels/:id, DELETE /contact-channels/:id endpoints
 * (see docs/architecture.md §4 -- Contacts' create RPC is atomic, but there is no bulk "replace all
 * channels" endpoint). This hook diffs the form's channels against the original and dispatches the
 * right calls so the UI still feels like one cohesive save.
 */
export function useSaveContactWithChannels() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values, originalChannels }: SaveContactInput) => {
      const update: UpdateContactDTO = {
        firstName: values.firstName,
        lastName: values.lastName === '' ? null : (values.lastName ?? null),
        tags: values.tags,
        leadStatusId: values.leadStatusId ?? null,
        leadSourceId: values.leadSourceId ?? null,
        assignedToUserId: values.assignedToUserId ?? null,
      }

      type ChannelFormEntry = ContactFormValues['channels'][number]

      const keptIds = new Set(values.channels.filter((channel) => channel.id).map((channel) => channel.id))
      const removed = originalChannels.filter((channel) => !keptIds.has(channel.id))
      const added = values.channels.filter((channel) => !channel.id)
      const updated = values.channels.filter(
        (channel): channel is ChannelFormEntry & { id: string } => {
          if (!channel.id) return false
          const original = originalChannels.find((o) => o.id === channel.id)
          return Boolean(
            original && (original.value !== channel.value || original.isPrimary !== channel.isPrimary),
          )
        },
      )

      await Promise.all([
        contactsApi.update(id, update),
        ...added.map((channel) =>
          contactsApi.addChannel(id, {
            channelType: channel.channelType,
            value: channel.value,
            isPrimary: channel.isPrimary,
          }),
        ),
        ...updated.map((channel) =>
          contactsApi.updateChannel(channel.id, { value: channel.value, isPrimary: channel.isPrimary }),
        ),
        ...removed.map((channel) => contactsApi.removeChannel(channel.id)),
      ])
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contactsKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: contactsKeys.lists() }),
      ])
      toast.success('Contact updated')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update contact')
    },
  })
}
