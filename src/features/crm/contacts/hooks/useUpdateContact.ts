import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from '@/api/contactsApi'
import { ApiError } from '@/api/apiClient'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'
import type { UpdateContactDTO } from '@/features/crm/contacts/types/contact.types'

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContactDTO }) => contactsApi.update(id, input),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contactsKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: contactsKeys.detail(id) }),
      ])
      toast.success('Contact updated')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update contact')
    },
  })
}
