import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from '@/api/contactsApi'
import { ApiError } from '@/api/apiClient'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactsKeys.lists() })
      toast.success('Contact archived')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to archive contact')
    },
  })
}
