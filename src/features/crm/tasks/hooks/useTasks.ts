import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasksApi'
import { tasksKeys } from '@/features/crm/tasks/hooks/queryKeys'
import type { ListTasksParams } from '@/features/crm/tasks/types/task.types'

export function useTasks(params: ListTasksParams) {
  return useQuery({
    queryKey: tasksKeys.list(params),
    queryFn: () => tasksApi.list(params),
    placeholderData: (previousData) => previousData,
  })
}
