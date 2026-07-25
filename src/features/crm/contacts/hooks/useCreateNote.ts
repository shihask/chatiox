import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from '@/api/contactsApi'
import { ApiError } from '@/api/apiClient'
import { notesKeys } from '@/features/crm/contacts/hooks/queryKeys'

export function useCreateNote(contactId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) => contactsApi.createNote(contactId, { body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesKeys.byContact(contactId) })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to add note')
    },
  })
}
