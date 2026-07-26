import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notesApi } from '@/api/notesApi'
import { ApiError } from '@/api/apiClient'
import { notesKeys } from '@/features/crm/notes/hooks/queryKeys'

export function useCreateNote(contactId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) => notesApi.createForContact(contactId, { body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesKeys.all })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to add note')
    },
  })
}
