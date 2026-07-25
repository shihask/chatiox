import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tasksApi } from '@/api/tasksApi'
import { ApiError } from '@/api/apiClient'
import { tasksKeys } from '@/features/crm/tasks/hooks/queryKeys'
import type { CreateTaskDTO } from '@/features/crm/tasks/types/task.types'

export function useCreateTask(contactId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaskDTO) => tasksApi.createForContact(contactId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.all })
      toast.success('Task created')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to create task')
    },
  })
}
