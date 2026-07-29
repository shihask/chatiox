import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inboxApi } from '@/api/inboxApi'
import { ApiError } from '@/api/apiClient'
import { conversationsKeys } from '@/features/communication/inbox/hooks/queryKeys'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'

export function useCreateContactForConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, firstName, lastName }: { id: string; firstName: string; lastName?: string }) =>
      inboxApi.createContactForConversation(id, { firstName, lastName }),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: contactsKeys.all }),
      ])
      toast.success('Contact created and linked')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to create contact')
    },
  })
}
