import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from '@/api/contactsApi'
import { ApiError } from '@/api/apiClient'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'
import { analyticsKeys } from '@/features/analytics/hooks/queryKeys'

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: async () => {
      // Archiving removes the contact from every analytics aggregate it counted toward.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contactsKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: analyticsKeys.all }),
      ])
      toast.success('Contact archived')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to archive contact')
    },
  })
}
