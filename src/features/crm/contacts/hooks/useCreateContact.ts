import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from '@/api/contactsApi'
import { ApiError } from '@/api/apiClient'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'
import type { CreateContactDTO } from '@/features/crm/contacts/types/contact.types'

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContactDTO) => contactsApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactsKeys.lists() })
      toast.success('Contact created')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to create contact')
    },
  })
}
