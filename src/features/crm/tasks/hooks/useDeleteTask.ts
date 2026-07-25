import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tasksApi } from '@/api/tasksApi'
import { ApiError } from '@/api/apiClient'
import { tasksKeys } from '@/features/crm/tasks/hooks/queryKeys'

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.all })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to delete task')
    },
  })
}
