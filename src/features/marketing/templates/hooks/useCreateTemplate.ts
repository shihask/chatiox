import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { templatesApi } from '@/api/templatesApi'
import { ApiError } from '@/api/apiClient'
import { templatesKeys } from '@/features/marketing/templates/hooks/queryKeys'
import type { CreateTemplateDTO } from '@/features/marketing/templates/types/template.types'

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTemplateDTO) => templatesApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: templatesKeys.lists() })
      toast.success('Template created')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to create template')
    },
  })
}
