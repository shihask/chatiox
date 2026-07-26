import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notesApi } from '@/api/notesApi'
import { ApiError } from '@/api/apiClient'
import { notesKeys } from '@/features/crm/notes/hooks/queryKeys'

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesKeys.all })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to delete note')
    },
  })
}
