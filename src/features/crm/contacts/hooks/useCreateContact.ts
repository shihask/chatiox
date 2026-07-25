import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from '@/api/contactsApi'
import { ApiError } from '@/api/apiClient'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'
import { analyticsKeys } from '@/features/analytics/hooks/queryKeys'
import type { CreateContactDTO } from '@/features/crm/contacts/types/contact.types'

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContactDTO) => contactsApi.create(input),
    onSuccess: async () => {
      // A new contact can carry a lead status/source from creation, so the analytics aggregates
      // (grouped counts over contacts) need to be treated as stale too, not just the contacts list.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contactsKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: analyticsKeys.all }),
      ])
      toast.success('Contact created')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to create contact')
    },
  })
}
