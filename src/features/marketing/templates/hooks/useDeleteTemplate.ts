import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { templatesApi } from '@/api/templatesApi'
import { ApiError } from '@/api/apiClient'
import { templatesKeys } from '@/features/marketing/templates/hooks/queryKeys'

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => templatesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: templatesKeys.lists() })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to delete template')
    },
  })
}
