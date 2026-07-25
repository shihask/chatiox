import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasksApi'
import { tasksKeys } from '@/features/crm/tasks/hooks/queryKeys'

export function useContactTasks(contactId: string) {
  return useQuery({
    queryKey: tasksKeys.byContact(contactId),
    queryFn: () => tasksApi.listByContact(contactId),
  })
}
