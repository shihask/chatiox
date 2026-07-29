import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inboxApi } from '@/api/inboxApi'
import { ApiError } from '@/api/apiClient'
import { conversationsKeys } from '@/features/communication/inbox/hooks/queryKeys'

export function useLinkContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, contactId }: { id: string; contactId: string }) => inboxApi.linkContact(id, contactId),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() }),
      ])
      toast.success('Contact linked')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to link contact')
    },
  })
}
