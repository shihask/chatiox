import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tasksApi } from '@/api/tasksApi'
import { ApiError } from '@/api/apiClient'
import { tasksKeys } from '@/features/crm/tasks/hooks/queryKeys'
import type { UpdateTaskDTO } from '@/features/crm/tasks/types/task.types'

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskDTO }) => tasksApi.update(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.all })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update task')
    },
  })
}
